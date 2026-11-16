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

export type QuotaStatus = "available" | "rpm_limited" | "rpd_exhausted";

export type ErrorCode =
  | "RATE_LIMIT_RPM"
  | "QUOTA_EXHAUSTED_RPD"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FORMAT"
  | "FILE_READ_FAILED"
  | "NETWORK_ERROR"
  | "API_KEY_INVALID"
  | "EMPTY_OUTPUT"
  | "TRANSCRIPTION_FAILED";

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  variant: "error" | "warning" | "info";
}

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
