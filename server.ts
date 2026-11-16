import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB

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
type ServerErrorCode =
  | "RATE_LIMIT_RPM"
  | "QUOTA_EXHAUSTED_RPD"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FORMAT"
  | "FILE_READ_FAILED"
  | "API_KEY_INVALID"
  | "EMPTY_OUTPUT"
  | "TRANSCRIPTION_FAILED";

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

interface ClassifiedError {
  status: number;
  code: ServerErrorCode;
  message: string;
  retryAfterSeconds?: number;
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

function extractRetrySeconds(rawText: string): number {
  const retryInMatch = rawText.match(/retry\s+(?:in|after)\s+(\d+(?:\.\d+)?)\s*s/i);
  if (retryInMatch) {
    return Math.max(5, Math.min(300, Math.ceil(Number(retryInMatch[1]))));
  }
  const retryDelayMatch = rawText.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (retryDelayMatch) {
    return Math.max(5, Math.min(300, Math.ceil(Number(retryDelayMatch[1]))));
  }
  return 60;
}

function classifyGeminiError(err: unknown, uiLang: UiLang): ClassifiedError {
  const errObj = (typeof err === "object" && err !== null ? err : {}) as Record<string, unknown>;
  const rawMessage = err instanceof Error ? err.message : String(err);
  let serialized = rawMessage;
  try {
    serialized = `${rawMessage} ${JSON.stringify(errObj)}`;
  } catch {
    // Keep rawMessage
  }
  const lower = serialized.toLowerCase();
  const numericStatus = typeof errObj.status === "number" ? errObj.status : 0;

  if (rawMessage.includes("GEMINI_API_KEY")) {
    return {
      status: 500,
      code: "API_KEY_INVALID",
      message:
        uiLang === "es"
          ? "La clave de API de Gemini no está configurada en el servidor. Revisa el panel Settings > Secrets."
          : "Gemini API key is not configured on the server. Check Settings > Secrets.",
    };
  }

  if (
    numericStatus === 401 ||
    numericStatus === 403 ||
    lower.includes("permission_denied") ||
    lower.includes("api_key_invalid")
  ) {
    return {
      status: 403,
      code: "API_KEY_INVALID",
      message:
        uiLang === "es"
          ? "La clave de API no es válida o no tiene permisos. Verifica Settings > Secrets."
          : "Invalid or unauthorized API key. Verify your key in Settings > Secrets.",
    };
  }

  const isRateOrQuota =
    numericStatus === 429 ||
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("too many requests") ||
    lower.includes("quota exceeded") ||
    lower.includes("rate limit") ||
    lower.includes("ratelimit");

  if (isRateOrQuota) {
    const isDailyRpd =
      lower.includes("perday") ||
      lower.includes("requestsperday") ||
      lower.includes("per_day") ||
      lower.includes("rpd") ||
      lower.includes("daily") ||
      lower.includes("generaterequestsperday");

    if (isDailyRpd) {
      return {
        status: 429,
        code: "QUOTA_EXHAUSTED_RPD",
        message:
          uiLang === "es"
            ? "Se ha alcanzado el límite diario de transcripciones gratuitas de la API. Podrás continuar mañana cuando se renueve la cuota."
            : "The daily free API transcription limit has been reached. You can continue tomorrow when the quota resets.",
      };
    }

    const retryAfterSeconds = extractRetrySeconds(serialized);
    return {
      status: 429,
      code: "RATE_LIMIT_RPM",
      retryAfterSeconds,
      message:
        uiLang === "es"
          ? `Límite por minuto alcanzado. Disponible en ${retryAfterSeconds} segundos.`
          : `Per-minute rate limit reached. Available in ${retryAfterSeconds} seconds.`,
    };
  }

  if (numericStatus === 404 || lower.includes("not_found")) {
    return {
      status: 404,
      code: "TRANSCRIPTION_FAILED",
      message:
        uiLang === "es"
          ? "No se encontró el modelo de transcripción configurado en la API."
          : "The configured Gemini model was not found.",
    };
  }

  return {
    status: 500,
    code: "TRANSCRIPTION_FAILED",
    message:
      rawMessage ||
      (uiLang === "es"
        ? "No se pudo completar la transcripción del manuscrito."
        : "Failed to transcribe manuscript."),
  };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "30mb" }));

  // Intercept oversized payloads / invalid JSON from express.json
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    const errObj = (typeof err === "object" && err !== null ? err : {}) as Record<string, unknown>;
    if (errObj.type === "entity.too.large" || errObj.status === 413) {
      const uiLang: UiLang = req.headers["x-ui-lang"] === "en" ? "en" : "es";
      res.status(413).json({
        error:
          uiLang === "es"
            ? "El archivo supera el tamaño máximo permitido (20 MB)."
            : "File exceeds the maximum allowed size (20 MB).",
        code: "FILE_TOO_LARGE",
        status: 413,
      });
      return;
    }
    if (err instanceof SyntaxError && errObj.status === 400) {
      res.status(400).json({
        error: "Invalid request payload.",
        code: "FILE_READ_FAILED",
        status: 400,
      });
      return;
    }
    next(err);
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post("/api/transcribe", async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as TranscribeRequestBody;
    const uiLang: UiLang = body.uiLang === "en" ? "en" : "es";
    const rawBase64 = body.imageBase64?.trim();
    const mimeType = body.mimeType?.trim() || "image/jpeg";

    if (!rawBase64) {
      res.status(400).json({
        error:
          uiLang === "es"
            ? "No se recibió ninguna imagen del folio."
            : "No manuscript image provided.",
        code: "FILE_READ_FAILED",
        status: 400,
      });
      return;
    }

    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const normalizedMime = mimeType === "image/jpg" ? "image/jpeg" : mimeType;
    if (!allowedMimeTypes.includes(mimeType)) {
      res.status(400).json({
        error:
          uiLang === "es"
            ? "Formato no válido. Sube imágenes JPG, PNG, WEBP o GIF."
            : `Unsupported image format: ${mimeType}. Please upload JPG, PNG, WEBP, or GIF.`,
        code: "UNSUPPORTED_FORMAT",
        status: 400,
      });
      return;
    }

    // Strip potential data URI prefix if caller sent one
    const cleanBase64 = rawBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
    const approxBytes = Math.floor((cleanBase64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      res.status(413).json({
        error:
          uiLang === "es"
            ? "El archivo supera el tamaño máximo permitido (20 MB)."
            : "The file exceeds the maximum allowed size (20 MB).",
        code: "FILE_TOO_LARGE",
        status: 413,
      });
      return;
    }

    const language: LanguageHint = body.language ?? "auto";
    const mode: TranscriptionMode = body.mode ?? "diplomatic";
    const preserveLineBreaks = body.preserveLineBreaks !== false;
    const includeMarginalia = body.includeMarginalia !== false;
    const customInstruction = (body.customInstruction ?? "").trim().slice(0, 600);

    let clientAborted = false;
    res.on("close", () => {
      if (!res.writableEnded) {
        clientAborted = true;
      }
    });

    const sendEvent = (payload: Record<string, unknown>) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    let stream: Awaited<ReturnType<GoogleGenAI["models"]["generateContentStream"]>>;
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

      stream = await ai.models.generateContentStream({
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
    } catch (err) {
      const classified = classifyGeminiError(err, uiLang);
      if (classified.retryAfterSeconds) {
        res.setHeader("Retry-After", String(classified.retryAfterSeconds));
      }
      res.status(classified.status).json({
        error: classified.message,
        code: classified.code,
        status: classified.status,
        retryAfterSeconds: classified.retryAfterSeconds,
      });
      return;
    }

    // Stream started successfully — switch to SSE
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    res.write(": connected\n\n");

    try {
      let emittedChars = 0;
      for await (const chunk of stream) {
        if (clientAborted) break;
        if (chunk.text) {
          emittedChars += chunk.text.length;
          sendEvent({ text: chunk.text });
        }
      }

      if (!clientAborted) {
        if (emittedChars === 0) {
          sendEvent({
            error:
              uiLang === "es"
                ? "No se pudo extraer texto legible de esta imagen. Verifique que el archivo contenga un manuscrito nítido."
                : "No readable text could be extracted from this image. Please verify the manuscript scan is clear.",
            code: "EMPTY_OUTPUT",
            status: 200,
          });
        } else {
          sendEvent({ done: true });
        }
      }
      res.end();
    } catch (err) {
      const classified = classifyGeminiError(err, uiLang);
      sendEvent({
        error: classified.message,
        code: classified.code,
        status: classified.status,
        retryAfterSeconds: classified.retryAfterSeconds,
      });
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
