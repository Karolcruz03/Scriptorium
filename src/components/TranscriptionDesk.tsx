import React, { useMemo, useState } from "react";
import {
  Play,
  Square,
  Copy,
  Check,
  Download,
  SlidersHorizontal,
  Edit3,
  BookOpen,
  ListOrdered,
  AlertCircle,
} from "lucide-react";
import {
  ActiveDocument,
  LanguageHint,
  TranscriptionMode,
} from "../types/paleography";
import { parseTranscriptionSections } from "../utils/image";
import { UiDictionary } from "../i18n/translations";

interface TranscriptionDeskProps {
  document: ActiveDocument;
  language: LanguageHint;
  onLanguageChange: (lang: LanguageHint) => void;
  mode: TranscriptionMode;
  onModeChange: (mode: TranscriptionMode) => void;
  preserveLineBreaks: boolean;
  onPreserveLineBreaksChange: (val: boolean) => void;
  includeMarginalia: boolean;
  onIncludeMarginaliaChange: (val: boolean) => void;
  customInstruction: string;
  onCustomInstructionChange: (val: string) => void;
  transcriptionText: string;
  onTranscriptionTextChange: (val: string) => void;
  isStreaming: boolean;
  error: string | null;
  onTranscribe: (overrideMode?: TranscriptionMode) => void;
  onStop: () => void;
  t: UiDictionary;
}

const LANGUAGE_IDS: LanguageHint[] = ["auto", "spanish", "english", "latin"];
const MODE_IDS: TranscriptionMode[] = [
  "diplomatic",
  "normalized",
  "translation",
  "analysis",
];

function renderBracketedLine(line: string): React.ReactNode {
  const tokenRegex = /(\[illegible\]|\[damaged:[^\]]+\])/gi;
  const parts = line.split(tokenRegex);
  return parts.map((part, idx) => {
    if (
      part.toLowerCase() === "[illegible]" ||
      part.toLowerCase().startsWith("[damaged:")
    ) {
      return (
        <span
          key={idx}
          className="font-mono text-[0.82em] font-medium text-[#8B2E14]"
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const TranscriptionDesk: React.FC<TranscriptionDeskProps> = ({
  document,
  language,
  onLanguageChange,
  mode,
  onModeChange,
  preserveLineBreaks,
  onPreserveLineBreaksChange,
  includeMarginalia,
  onIncludeMarginaliaChange,
  customInstruction,
  onCustomInstructionChange,
  transcriptionText,
  onTranscriptionTextChange,
  isStreaming,
  error,
  onTranscribe,
  onStop,
  t,
}) => {
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const parsed = useMemo(
    () => parseTranscriptionSections(transcriptionText),
    [transcriptionText]
  );

  const bodyLines = useMemo(() => {
    if (!parsed.body) return [];
    return parsed.body.split("\n");
  }, [parsed.body]);

  const wordCount = useMemo(() => {
    const trimmed = transcriptionText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [transcriptionText]);

  const handleCopy = async () => {
    if (!transcriptionText.trim()) return;
    try {
      await navigator.clipboard.writeText(transcriptionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleDownload = (format: "txt" | "md") => {
    if (!transcriptionText.trim()) return;
    const safeSlug = document.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const content =
      format === "md"
        ? `# ${document.title}\n\n- ${document.subtitle}\n- ${t.desk.languages[language]} · ${t.desk.modes[mode]}\n\n---\n\n${transcriptionText}\n`
        : transcriptionText;
    const blob = new Blob([content], {
      type:
        format === "md"
          ? "text/markdown;charset=utf-8"
          : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${safeSlug || "transcripcion"}-${mode}.${format}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-label={t.desk.ariaLabel}
      className="flex h-full flex-col border border-stone-200 bg-white"
    >
      {/* Controls Header */}
      <div className="border-b border-stone-200 bg-[#F6F3EC] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Language & Mode Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              role="group"
              aria-label={t.desk.languageGroupAria}
              className="flex items-center rounded-md bg-stone-200/70 p-0.5"
            >
              {LANGUAGE_IDS.map((langId) => {
                const active = language === langId;
                return (
                  <button
                    key={langId}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => onLanguageChange(langId)}
                    className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                      active
                        ? "bg-white text-[#1C1917] shadow-xs"
                        : "text-stone-600 hover:text-[#1C1917]"
                    }`}
                  >
                    {t.desk.languages[langId]}
                  </button>
                );
              })}
            </div>

            <div
              role="group"
              aria-label={t.desk.modeGroupAria}
              className="flex items-center rounded-md bg-stone-200/70 p-0.5"
            >
              {MODE_IDS.map((modeId) => {
                const active = mode === modeId;
                return (
                  <button
                    key={modeId}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => onModeChange(modeId)}
                    className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                      active
                        ? "bg-white text-[#1C1917] shadow-xs"
                        : "text-stone-600 hover:text-[#1C1917]"
                    }`}
                  >
                    {t.desk.modes[modeId]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOptions((prev) => !prev)}
              aria-expanded={showOptions}
              className={`inline-flex h-9 items-center gap-1.5 rounded border px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showOptions
                  ? "border-stone-400 bg-white text-[#1C1917]"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-[#1C1917]"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.desk.options}</span>
            </button>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex h-9 items-center gap-1.5 rounded bg-[#1C1917] px-4 text-xs font-semibold text-[#FBF9F5] transition-colors hover:bg-stone-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                <span>{t.desk.stop}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  onTranscribe();
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded bg-[#8B2E14] px-4 text-xs font-semibold text-[#FBF9F5] transition-colors hover:bg-[#73240F] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>{t.desk.transcribeFolio}</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Paleographic Options Drawer */}
        {showOptions && (
          <div className="mt-3 grid gap-3 border-t border-stone-200 pt-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 text-xs text-stone-700">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveLineBreaks}
                  onChange={(e) => onPreserveLineBreaksChange(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 accent-[#8B2E14]"
                />
                <span>{t.desk.preserveLineBreaks}</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMarginalia}
                  onChange={(e) => onIncludeMarginaliaChange(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 accent-[#8B2E14]"
                />
                <span>{t.desk.includeMarginalia}</span>
              </label>
            </div>

            <div>
              <label
                htmlFor="custom-paleo-instruction"
                className="block text-xs font-medium text-stone-600 mb-1"
              >
                {t.desk.customInstructionLabel}
              </label>
              <input
                id="custom-paleo-instruction"
                type="text"
                value={customInstruction}
                onChange={(e) => onCustomInstructionChange(e.target.value)}
                placeholder={t.desk.customInstructionPlaceholder}
                className="w-full rounded border border-stone-300 bg-white px-3 py-1.5 text-xs text-[#1C1917] placeholder:text-stone-400 focus:border-[#8B2E14] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Secondary Reading Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-4 py-2 text-xs text-stone-500">
        <div className="flex items-center gap-3 tabular-nums">
          <span className="font-medium text-stone-700">
            {t.desk.editionLabels[mode]}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {wordCount} {t.desk.words}
          </span>
          {isStreaming && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#8B2E14]">
                {t.desk.transcribingStatus}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLineNumbers((v) => !v)}
            aria-pressed={showLineNumbers}
            className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
              showLineNumbers
                ? "bg-stone-100 text-[#1C1917]"
                : "text-stone-500 hover:text-[#1C1917]"
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.desk.lines}</span>
          </button>

          {transcriptionText && !isStreaming && (
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              aria-pressed={isEditing}
              className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                isEditing
                  ? "bg-stone-100 text-[#1C1917]"
                  : "text-stone-500 hover:text-[#1C1917]"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isEditing ? t.desk.readingView : t.desk.proofread}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Transcription Sheet */}
      <div className="relative min-h-[440px] lg:h-[550px] flex-1 overflow-y-auto bg-[#FFFEFC] px-6 py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-900"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-red-700"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">{t.desk.errorTitle}</p>
              <p className="mt-0.5 text-red-800">{error}</p>
            </div>
          </div>
        )}

        {!transcriptionText && !isStreaming && !error && (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <BookOpen className="h-8 w-8 text-stone-300 mb-3" aria-hidden="true" />
            <h3 className="font-serif text-2xl font-medium text-[#1C1917]">
              {t.desk.emptyTitle}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500">
              {t.desk.emptyBody}
            </p>
            <button
              type="button"
              onClick={() => onTranscribe()}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#8B2E14] px-5 py-2.5 text-xs font-semibold text-[#FBF9F5] transition-colors hover:bg-[#73240F] cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>{t.desk.emptyCta}</span>
            </button>
          </div>
        )}

        {transcriptionText && isEditing ? (
          <textarea
            aria-label={t.desk.proofread}
            value={transcriptionText}
            onChange={(e) => onTranscriptionTextChange(e.target.value)}
            className="h-full w-full resize-none border border-stone-200 bg-[#FBF9F5] p-4 font-serif text-[18px] leading-[1.75] text-[#1C1917] focus:border-[#8B2E14] focus:outline-none"
          />
        ) : (
          transcriptionText && (
            <div className="space-y-6">
              {/* Main Folio Body */}
              <div className="font-serif text-[19px] leading-[1.75] text-[#1C1917]">
                {bodyLines.map((line, idx) => {
                  const isBlank = line.trim().length === 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-baseline gap-4 min-h-[1.75rem]"
                    >
                      {showLineNumbers && (
                        <span className="w-7 shrink-0 select-none text-right font-mono text-[11px] text-stone-400 tabular-nums">
                          {idx + 1}
                        </span>
                      )}
                      <p className="flex-1 whitespace-pre-wrap break-words">
                        {isBlank ? "\u00A0" : renderBracketedLine(line)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Marginalia Section */}
              {parsed.marginalia && (
                <div className="border border-stone-200 bg-[#F6F3EC] p-4">
                  <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-stone-600 mb-2">
                    {t.desk.marginaliaHeading}
                  </h4>
                  <div className="font-serif text-[17px] leading-[1.7] text-[#1C1917] whitespace-pre-wrap">
                    {renderBracketedLine(parsed.marginalia)}
                  </div>
                </div>
              )}

              {/* Paleographic & Historical Analysis Section (when explicitly requested) */}
              {parsed.analysis && (
                <div className="border-t border-stone-200 pt-5">
                  <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-stone-600 mb-2.5">
                    {t.desk.analysisHeading}
                  </h4>
                  <div className="font-sans text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
                    {parsed.analysis}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {isStreaming && !transcriptionText && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-[#8B2E14]" />
            <p className="font-serif text-lg text-stone-700">
              {t.desk.streamingWait}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Export & Follow-Up Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-[#FBF9F5] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {transcriptionText && !isStreaming && mode === "diplomatic" && (
            <>
              <span className="text-xs text-stone-500 mr-1">
                {t.desk.deriveLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  onModeChange("normalized");
                  onTranscribe("normalized");
                }}
                className="rounded border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.desk.deriveNormalized}
              </button>
              <button
                type="button"
                onClick={() => {
                  onModeChange("translation");
                  onTranscribe("translation");
                }}
                className="rounded border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.desk.deriveTranslate}
              </button>
              <button
                type="button"
                onClick={() => {
                  onModeChange("analysis");
                  onTranscribe("analysis");
                }}
                className="rounded border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.desk.deriveAnalysis}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!transcriptionText.trim()}
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-[#1C1917] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                <span>{t.desk.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.desk.copyText}</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!transcriptionText.trim()}
            onClick={() => handleDownload("txt")}
            className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-[#1C1917] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>.TXT</span>
          </button>

          <button
            type="button"
            disabled={!transcriptionText.trim()}
            onClick={() => handleDownload("md")}
            className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-[#1C1917] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>.MD</span>
          </button>
        </div>
      </div>
    </section>
  );
};
