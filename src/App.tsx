import React, { useEffect, useMemo, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { TopBar } from "./components/TopBar";
import { ManuscriptViewer } from "./components/ManuscriptViewer";
import { TranscriptionDesk } from "./components/TranscriptionDesk";
import { SpecimenVault } from "./components/SpecimenVault";
import { EditorialStandards } from "./components/EditorialStandards";
import { ArchiveHistory } from "./components/ArchiveHistory";
import { SPECIMENS } from "./data/specimens";
import { TRANSLATIONS, UiLang } from "./i18n/translations";
import {
  ActiveDocument,
  LanguageHint,
  ManuscriptSpecimen,
  TranscriptionMode,
  TranscriptionRecord,
} from "./types/paleography";
import { fileToImagePayload, urlToImagePayload } from "./utils/image";

const STORAGE_KEY = "scriptorium_archive_log_v1";
const UI_LANG_KEY = "scriptorium_ui_lang_v1";

function specimenToActive(
  specimen: ManuscriptSpecimen,
  lang: UiLang
): ActiveDocument {
  const copy = TRANSLATIONS[lang].specimenCopy[specimen.id];
  return {
    id: specimen.id,
    title: copy?.title ?? specimen.title,
    subtitle: `${specimen.repository} · ${specimen.shelfmark} · ${
      copy?.dateLabel ?? specimen.dateLabel
    }`,
    imageUrl: specimen.imageUrl,
    mimeType: "image/jpeg",
    defaultLanguage: specimen.languageHint,
    isCustomUpload: false,
  };
}

export default function App() {
  const [uiLang, setUiLang] = useState<UiLang>(() => {
    try {
      const saved = localStorage.getItem(UI_LANG_KEY);
      return saved === "en" ? "en" : "es";
    } catch {
      return "es";
    }
  });

  const t = TRANSLATIONS[uiLang];

  const [activeDoc, setActiveDoc] = useState<ActiveDocument>(() =>
    specimenToActive(SPECIMENS[0], uiLang)
  );
  const [language, setLanguage] = useState<LanguageHint>(
    SPECIMENS[0].languageHint
  );
  const [mode, setMode] = useState<TranscriptionMode>("diplomatic");
  const [preserveLineBreaks, setPreserveLineBreaks] = useState<boolean>(true);
  const [includeMarginalia, setIncludeMarginalia] = useState<boolean>(true);
  const [customInstruction, setCustomInstruction] = useState<string>("");

  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<TranscriptionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as TranscriptionRecord[]) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(UI_LANG_KEY, uiLang);
    } catch {
      // Ignore storage errors
    }
    document.documentElement.lang = uiLang;
    document.title = TRANSLATIONS[uiLang].pageTitle;
  }, [uiLang]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  // Keep built-in specimen title/subtitle localized when switching UI language
  const localizedActiveDoc = useMemo(() => {
    if (activeDoc.isCustomUpload) return activeDoc;
    const matched = SPECIMENS.find((s) => s.id === activeDoc.id);
    return matched ? specimenToActive(matched, uiLang) : activeDoc;
  }, [activeDoc, uiLang]);

  // Support pasting manuscript images directly from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleFileSelected(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(TRANSLATIONS[uiLang].errors.invalidFileType);
      return;
    }
    try {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
      setError(null);
      setTranscriptionText("");

      const payload = await fileToImagePayload(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setActiveDoc({
        id: `upload-${Date.now()}`,
        title: cleanName || TRANSLATIONS[uiLang].uploadMeta.defaultTitle,
        subtitle: `${TRANSLATIONS[uiLang].uploadMeta.subtitlePrefix} · ${(
          file.size / 1024
        ).toFixed(0)} KB`,
        imageUrl: payload.dataUrl,
        mimeType: payload.mimeType,
        defaultLanguage: "auto",
        isCustomUpload: true,
      });
      setLanguage("auto");
      setMode("diplomatic");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : TRANSLATIONS[uiLang].errors.loadFileError
      );
    }
  };

  const handleSelectSpecimen = (specimen: ManuscriptSpecimen) => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setError(null);
    setTranscriptionText("");
    setActiveDoc(specimenToActive(specimen, uiLang));
    setLanguage(specimen.languageHint);
    setMode("diplomatic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const handleTranscribe = async (overrideMode?: TranscriptionMode) => {
    const activeMode = overrideMode ?? mode;
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setError(null);
    setTranscriptionText("");

    try {
      const { base64, mimeType } = await urlToImagePayload(
        localizedActiveDoc.imageUrl
      );

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          language,
          mode: activeMode,
          uiLang,
          preserveLineBreaks,
          includeMarginalia,
          customInstruction,
        }),
      });

      if (
        !response.ok &&
        !response.headers.get("content-type")?.includes("text/event-stream")
      ) {
        const errJson = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errJson.error || `Server returned status ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error(t.errors.emptyStream);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      const processEventChunk = (eventChunk: string) => {
        const lines = eventChunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const rawJson = line.slice(6).trim();
          if (!rawJson) continue;
          try {
            const parsed = JSON.parse(rawJson) as {
              text?: string;
              done?: boolean;
              error?: string;
            };
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulated += parsed.text;
              setTranscriptionText(accumulated);
            }
          } catch (parseErr) {
            if (
              parseErr instanceof Error &&
              parseErr.message !== "Unexpected end of JSON input"
            ) {
              throw parseErr;
            }
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          processEventChunk(eventChunk);
        }
      }

      if (buffer.trim()) {
        processEventChunk(buffer);
      }

      if (accumulated.trim()) {
        const newRecord: TranscriptionRecord = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: localizedActiveDoc.title,
          createdAt: new Date().toISOString(),
          language,
          mode: activeMode,
          text: accumulated.trim(),
          previewImageUrl: localizedActiveDoc.isCustomUpload
            ? undefined
            : localizedActiveDoc.imageUrl,
        };
        setHistory((prev) => [newRecord, ...prev].slice(0, 20));
      } else {
        setError(t.errors.emptyStream);
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : t.errors.unexpectedError);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleLoadRecord = (record: TranscriptionRecord) => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setError(null);
    if (record.previewImageUrl) {
      const matched = SPECIMENS.find(
        (s) => s.imageUrl === record.previewImageUrl
      );
      if (matched) {
        setActiveDoc(specimenToActive(matched, uiLang));
      }
    }
    setLanguage(record.language);
    setMode(record.mode);
    setTranscriptionText(record.text);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteRecord = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelected(file);
          }
          e.target.value = "";
        }}
      />

      <TopBar
        onUploadClick={triggerUpload}
        historyCount={history.length}
        t={t}
      />

      <main>
        {/* Editorial Masthead + Language Switcher + Primary Workbench */}
        <section
          id="workbench"
          className="mx-auto max-w-[1440px] px-6 pt-7 pb-12 lg:px-10"
        >
          <div className="mb-6 flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
                {t.masthead.kicker}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-[#1C1917] sm:text-4xl [text-wrap:balance]">
                {t.masthead.title}
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-stone-500">
                {t.masthead.subtitle}
              </p>
            </div>

            {/* Interface Language Switcher (ES / EN) */}
            <div className="flex items-center gap-3 self-start lg:self-end shrink-0">
              <div
                role="group"
                aria-label={t.masthead.interfaceLabel}
                className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-[#F3EFE7] p-1"
              >
                <Globe
                  className="ml-2 mr-1 h-3.5 w-3.5 text-stone-500"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setUiLang("es")}
                  aria-pressed={uiLang === "es"}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    uiLang === "es"
                      ? "bg-white text-[#1C1917] shadow-xs"
                      : "text-stone-600 hover:text-[#1C1917]"
                  }`}
                >
                  {t.masthead.switchToSpanish}
                </button>
                <button
                  type="button"
                  onClick={() => setUiLang("en")}
                  aria-pressed={uiLang === "en"}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    uiLang === "en"
                      ? "bg-white text-[#1C1917] shadow-xs"
                      : "text-stone-600 hover:text-[#1C1917]"
                  }`}
                >
                  {t.masthead.switchToEnglish}
                </button>
              </div>
            </div>
          </div>

          {/* 2-Column Balanced Split Workbench */}
          <div className="grid items-stretch gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <ManuscriptViewer
                document={localizedActiveDoc}
                onFileSelected={handleFileSelected}
                onTriggerUpload={triggerUpload}
                t={t}
              />
            </div>

            <div className="lg:col-span-6">
              <TranscriptionDesk
                document={localizedActiveDoc}
                language={language}
                onLanguageChange={setLanguage}
                mode={mode}
                onModeChange={setMode}
                preserveLineBreaks={preserveLineBreaks}
                onPreserveLineBreaksChange={setPreserveLineBreaks}
                includeMarginalia={includeMarginalia}
                onIncludeMarginaliaChange={setIncludeMarginalia}
                customInstruction={customInstruction}
                onCustomInstructionChange={setCustomInstruction}
                transcriptionText={transcriptionText}
                onTranscriptionTextChange={setTranscriptionText}
                isStreaming={isStreaming}
                error={error}
                onTranscribe={handleTranscribe}
                onStop={handleStop}
                t={t}
              />
            </div>
          </div>
        </section>

        <SpecimenVault
          specimens={SPECIMENS}
          activeId={localizedActiveDoc.id}
          onSelectSpecimen={handleSelectSpecimen}
          t={t}
        />

        <EditorialStandards t={t} />

        <ArchiveHistory
          records={history}
          onLoadRecord={handleLoadRecord}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearHistory}
          t={t}
          uiLang={uiLang}
        />
      </main>

      <footer className="border-t border-stone-200 bg-[#F6F3EC]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-stone-500 lg:px-10">
          <span className="font-serif text-sm font-medium text-[#1C1917]">
            Scriptorium
          </span>
          <span>{t.footer.tagline}</span>
        </div>
      </footer>
    </div>
  );
}
