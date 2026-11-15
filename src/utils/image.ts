export async function fileToImagePayload(file: File): Promise<{
  base64: string;
  mimeType: string;
  dataUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("Could not read image file."));
        return;
      }
      const commaIdx = dataUrl.indexOf(",");
      if (commaIdx === -1) {
        reject(new Error("Invalid image data URL."));
        return;
      }
      const base64 = dataUrl.slice(commaIdx + 1);
      const mimeType = file.type || "image/jpeg";
      resolve({ base64, mimeType, dataUrl });
    };
    reader.onerror = () => reject(new Error("Failed to read selected file."));
    reader.readAsDataURL(file);
  });
}

export async function urlToImagePayload(url: string): Promise<{
  base64: string;
  mimeType: string;
}> {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid embedded image format.");
    }
    return { mimeType: match[1], base64: match[2] };
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load specimen image for transcription.");
  }
  const blob = await res.blob();
  const mimeType = blob.type || "image/jpeg";

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to encode specimen image."));
        return;
      }
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error("Failed to read specimen blob."));
    reader.readAsDataURL(blob);
  });

  return { base64, mimeType };
}

export interface ParsedTranscription {
  body: string;
  marginalia: string | null;
  analysis: string | null;
}

export function parseTranscriptionSections(raw: string): ParsedTranscription {
  const normalized = raw.replace(/\r\n/g, "\n");
  const marginaliaMarker = /\[Marginalia\]/i;
  const analysisMarker = /\[Paleographic & Historical Analysis\]/i;

  let body = normalized;
  let marginalia: string | null = null;
  let analysis: string | null = null;

  const analysisMatch = normalized.match(analysisMarker);
  let beforeAnalysis = normalized;
  if (analysisMatch && analysisMatch.index !== undefined) {
    beforeAnalysis = normalized.slice(0, analysisMatch.index).trimEnd();
    analysis = normalized
      .slice(analysisMatch.index + analysisMatch[0].length)
      .trim();
  }

  const margMatch = beforeAnalysis.match(marginaliaMarker);
  if (margMatch && margMatch.index !== undefined) {
    body = beforeAnalysis.slice(0, margMatch.index).trimEnd();
    marginalia = beforeAnalysis
      .slice(margMatch.index + margMatch[0].length)
      .trim();
  } else {
    body = beforeAnalysis.trimEnd();
  }

  return { body, marginalia, analysis };
}
