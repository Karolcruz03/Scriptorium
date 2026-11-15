import "dotenv/config";
import express, { Request, Response } from "express";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const PALEOGRAPHER_SYSTEM_INSTRUCTION = `You are an expert paleographer, historian, and advanced Handwritten Text Recognition (HTR) AI. Your task is to accurately transcribe digitized handwritten documents, letters, manuscripts, and archival texts provided as images.

Languages supported: Spanish (including archaic/historical Spanish), English, and Latin.

Guidelines for transcription:
1. Preserve the original spelling, punctuation, and capitalization unless instructed otherwise. Do not modernize historical orthography unless a "normalized" version is explicitly requested.
2. If a word or phrase is completely illegible or damaged, mark it clearly in brackets like this: [illegible] or [damaged: possible word].
3. Maintain the original paragraph structure and line breaks where appropriate.
4. If there are marginalia (notes in the margins), transcribe them in a separate section labeled [Marginalia].
5. Handle complex cursive, fading ink, bleed-through, and historical letterforms (such as long s 'ſ' or archaic abbreviations in Latin and Spanish) with maximum fidelity.
6. Output only the clean transcription unless the user asks for a translation or historical analysis.`;

type LanguageHint = "auto" | "spanish" | "english" | "latin";
type TranscriptionMode = "diplomatic" | "normalized" | "translation" | "analysis";
type UiLang = "es" | "en";

interface TranscribeRequestBody {
  imageBase64?: string;
  mimeType?: string;
  language?: LanguageHint;
  mode?: TranscriptionMode;
  uiLang?: UiLang;
  preserveLineBreaks?: boolean;
  includeMarginalia?: boolean;
  customInstruction?: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function buildUserPrompt(opts: {
  language: LanguageHint;
  mode: TranscriptionMode;
  uiLang: UiLang;
  preserveLineBreaks: boolean;
  includeMarginalia: boolean;
  customInstruction: string;
}): string {
  const parts: string[] = [];
  const targetLangName = opts.uiLang === "es" ? "Spanish" : "English";

  if (opts.mode === "diplomatic") {
    parts.push(
      "Produce a strict diplomatic transcription of this manuscript image. Preserve original spelling, historical orthography, punctuation, capitalization, archaic abbreviations, and historical letterforms (such as long s 'ſ')."
    );
  } else if (opts.mode === "normalized") {
    parts.push(
      "The user explicitly requests a normalized version of this manuscript image. Modernize historical orthography, convert long s ('ſ') to 's', standardize archaic punctuation, and expand unambiguous abbreviations while preserving the exact original wording."
    );
  } else if (opts.mode === "translation") {
    parts.push(
      `The user explicitly requests a ${targetLangName} translation of this manuscript image. Provide an accurate, scholarly ${targetLangName} translation while preserving paragraph structure and translating any marginalia under a separate [Marginalia] heading.`
    );
  } else if (opts.mode === "analysis") {
    parts.push(
      `First provide the faithful diplomatic transcription (preserving original spelling, punctuation, capitalization, long s 'ſ', and [Marginalia] if present), and then add a section titled [Paleographic & Historical Analysis] written in ${targetLangName} summarizing the script hand, period characteristics, notable abbreviations, and historical context.`
    );
  }

  if (opts.language !== "auto") {
    const langLabel =
      opts.language === "spanish"
        ? "Spanish (including archaic or historical Spanish)"
        : opts.language === "latin"
          ? "Latin (including medieval/ecclesiastical or classical abbreviations)"
          : "English (including historical/early modern English)";
    parts.push(`Primary language of document: ${langLabel}.`);
  } else {
    parts.push(
      "Auto-detect the manuscript language among Spanish (including archaic/historical Spanish), English, and Latin."
    );
  }

  if (opts.preserveLineBreaks) {
    parts.push("Maintain the original line breaks and paragraph breaks as written on the folio.");
  } else {
    parts.push("Maintain original paragraph structure while reflowing individual lines into continuous prose.");
  }

  if (opts.includeMarginalia) {
    parts.push(
      "If any marginalia or margin glosses appear on the page, transcribe them in a separate section at the end labeled exactly: [Marginalia]"
    );
  } else {
    parts.push("Transcribe only the main body text; omit margin notes.");
  }

  parts.push(
    "Mark completely illegible words as [illegible] and partially damaged/uncertain words as [damaged: possible word]. Do not wrap your response in markdown code fences."
  );

  if (opts.mode === "diplomatic" || opts.mode === "normalized") {
    if (!opts.customInstruction) {
      parts.push("Output ONLY the clean transcription text with no introductory or concluding remarks.");
    }
  }

  if (opts.customInstruction) {
    parts.push(`User instruction: ${opts.customInstruction}`);
  }

  return parts.join("\n\n");
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("GEMINI_API_KEY")) {
    return {
      status: 500,
      message: "Gemini API key is not configured. Please check the Secrets panel.",
    };
  }
  if (raw.includes("PERMISSION_DENIED") || raw.includes("API_KEY_INVALID") || raw.includes("403")) {
    return {
      status: 403,
      message: "Invalid or unauthorized API key. Verify your key in the Settings > Secrets panel.",
    };
  }
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
    return {
      status: 429,
      message: "API rate limit or quota reached. Please try again shortly.",
    };
  }
  if (raw.includes("NOT_FOUND") || raw.includes("404")) {
    return {
      status: 404,
      message: "The requested Gemini model was not found.",
    };
  }
  return {
    status: 500,
    message: raw || "Failed to transcribe manuscript.",
  };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post("/api/transcribe", async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as TranscribeRequestBody;
    const rawBase64 = body.imageBase64?.trim();
    const mimeType = body.mimeType?.trim() || "image/jpeg";

    if (!rawBase64) {
      res.status(400).json({ error: "No manuscript image provided." });
      return;
    }

    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const normalizedMime = mimeType === "image/jpg" ? "image/jpeg" : mimeType;
    if (!allowedMimeTypes.includes(mimeType)) {
      res.status(400).json({ error: `Unsupported image format: ${mimeType}. Use JPEG, PNG, WEBP, or GIF.` });
      return;
    }

    // Strip potential data URI prefix if caller sent one
    const cleanBase64 = rawBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

    const language: LanguageHint = body.language ?? "auto";
    const mode: TranscriptionMode = body.mode ?? "diplomatic";
    const uiLang: UiLang = body.uiLang === "en" ? "en" : "es";
    const preserveLineBreaks = body.preserveLineBreaks !== false;
    const includeMarginalia = body.includeMarginalia !== false;
    const customInstruction = (body.customInstruction ?? "").trim().slice(0, 600);

    let clientAborted = false;
    req.on("close", () => {
      clientAborted = true;
    });

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const sendEvent = (payload: Record<string, unknown>) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    try {
      const ai = getGeminiClient();
      const prompt = buildUserPrompt({
        language,
        mode,
        uiLang,
        preserveLineBreaks,
        includeMarginalia,
        customInstruction,
      });

      const stream = await ai.models.generateContentStream({
        model: "gemini-4-hydrogen",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          systemInstruction: PALEOGRAPHER_SYSTEM_INSTRUCTION,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      for await (const chunk of stream) {
        if (clientAborted) break;
        if (chunk.text) {
          sendEvent({ text: chunk.text });
        }
      }

      if (!clientAborted) {
        sendEvent({ done: true });
      }
      res.end();
    } catch (err) {
      const formatted = formatGeminiError(err);
      sendEvent({ error: formatted.message, status: formatted.status });
      res.end();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Scriptorium archival server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
