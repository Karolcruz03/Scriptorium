export type LanguageHint = "auto" | "spanish" | "english" | "latin";

export type TranscriptionMode =
  | "diplomatic"
  | "normalized"
  | "translation"
  | "analysis";

export type OpticalFilter =
  | "original"
  | "high-contrast"
  | "bleed-reduction"
  | "inverted";

export interface ManuscriptSpecimen {
  id: string;
  title: string;
  dateLabel: string;
  languageLabel: string;
  languageHint: LanguageHint;
  repository: string;
  shelfmark: string;
  scriptType: string;
  description: string;
  imageUrl: string;
}

export interface ActiveDocument {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  mimeType: string;
  defaultLanguage: LanguageHint;
  isCustomUpload: boolean;
}

export interface TranscriptionRecord {
  id: string;
  title: string;
  createdAt: string;
  language: LanguageHint;
  mode: TranscriptionMode;
  text: string;
  previewImageUrl?: string;
}
