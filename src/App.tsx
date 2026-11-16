import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { TopBar } from "./components/TopBar";
import { ManuscriptViewer } from "./components/ManuscriptViewer";
import { TranscriptionDesk } from "./components/TranscriptionDesk";
import { SpecimenVault } from "./components/SpecimenVault";
import { EditorialStandards } from "./components/EditorialStandards";
import { ArchiveHistory } from "./components/ArchiveHistory";
import { ToastContainer } from "./components/ToastContainer";
import { SPECIMENS } from "./data/specimens";
import { TRANSLATIONS, UiLang } from "./i18n/translations";
import {
  ActiveDocument,
  ErrorCode,
  LanguageHint,
  ManuscriptSpecimen,
  QuotaStatus,
  ToastNotification,
  TranscriptionMode,
  TranscriptionRecord,
} from "./types/paleography";
import { fileToImagePayload, urlToImagePayload } from "./utils/image";

const STORAGE_KEY = "scriptorium_archive_log_v1";
const UI_LANG_KEY = "scriptorium_ui_lang_v1";
const SESSION_COUNT_KEY = "scriptorium_session_folios_v1";
const RPD_DATE_KEY = "scriptorium_rpd_exhausted_date_v1";
const RPM_UNTIL_KEY = "scriptorium_rpm_until_v1";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

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

interface ApiErrorPayload {
  error?: string;
  code?: ErrorCode;
  status?: number;
  retryAfterSeconds?: number;
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

  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus>(() => {
    try {
      const rpdDate = localStorage.getItem(RPD_DATE_KEY);
      if (rpdDate === getTodayKey()) {
        return "rpd_exhausted";
      }
      const rpmUntil = Number(localStorage.getItem(RPM_UNTIL_KEY) || 0);
      if (rpmUntil > Date.now()) {
        return "rpm_limited";
      }
    } catch {
      // Ignore storage failures
    }
    return "available";
  });

  const [rpmSecondsLeft, setRpmSecondsLeft] = useState<number>(() => {
    try {
      const rpmUntil = Number(localStorage.getItem(RPM_UNTIL_KEY) || 0);
      if (rpmUntil > Date.now()) {
        return Math.max(1, Math.ceil((rpmUntil - Date.now()) / 1000));
      }
    } catch {
      // Ignore
    }
    return 0;
  });

  const [sessionProcessedCount, setSessionProcessedCount] = useState<number>(
    () => {
      try {
        const saved = Number(sessionStorage.getItem(SESSION_COUNT_KEY) || 0);
        return Number.isFinite(saved) && saved >= 0 ? saved : 0;
      } catch {
        return 0;
      }
    }
  );

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

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

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (
      title: string,
      message: string,
      variant: ToastNotification["variant"] = "error"
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, message, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 6500);
    },
    []
  );

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

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_COUNT_KEY, String(sessionProcessedCount));
    } catch {
      // Ignore
    }
  }, [sessionProcessedCount]);

  // Automatic countdown timer for RPM rate limit recovery
  useEffect(() => {
    if (quotaStatus !== "rpm_limited") return;
    if (rpmSecondsLeft <= 0) {
      setQuotaStatus("available");
      setError(null);
      try {
        localStorage.removeItem(RPM_UNTIL_KEY);
      } catch {
        // Ignore
      }
      return;
    }

    const timerId = window.setInterval(() => {
      setRpmSecondsLeft((prev) => {
        if (prev <= 1) {
          setQuotaStatus("available");
          setError(null);
          try {
            localStorage.removeItem(RPM_UNTIL_KEY);
          } catch {
            // Ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [quotaStatus, rpmSecondsLeft]);

  const localizedActiveDoc = useMemo(() => {
    if (activeDoc.isCustomUpload) return activeDoc;
    const matched = SPECIMENS.find((s) => s.id === activeDoc.id);
    return matched ? specimenToActive(matched, uiLang) : activeDoc;
  }, [activeDoc, uiLang]);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = useCallback(
    async (file: File) => {
      const dict = TRANSLATIONS[uiLang];
      const hasValidMime = ALLOWED_IMAGE_MIME_TYPES.has(
        file.type.toLowerCase()
      );
      const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.test(file.name);

      if (!hasValidMime && !(file.type === "" && hasValidExt)) {
        pushToast(
          dict.toasts.uploadFailedTitle,
          dict.errors.invalidFileType,
          "error"
        );
        return;
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        pushToast(
          dict.toasts.uploadFailedTitle,
          dict.errors.fileTooLarge,
          "error"
        );
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
          title: cleanName || dict.uploadMeta.defaultTitle,
          subtitle: `${dict.uploadMeta.subtitlePrefix} · ${(
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
        const message =
          err instanceof Error ? err.message : dict.errors.loadFileError;
        pushToast(dict.toasts.uploadFailedTitle, message, "error");
      }
    },
    [uiLang, pushToast]
  );

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
        if (item.kind === "file") {
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
  }, [handleFileSelected]);

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

  const handleResetQuotaStatus = () => {
    setQuotaStatus("available");
    setRpmSecondsLeft(0);
    setError(null);
    try {
      localStorage.removeItem(RPD_DATE_KEY);
      localStorage.removeItem(RPM_UNTIL_KEY);
    } catch {
      // Ignore
    }
  };

  const applyServerErrorPayload = (payload: ApiErrorPayload, httpStatus?: number) => {
    const code = payload.code;
    const message = payload.error || t.errors.unexpectedError;

    const isRpd =
      code === "QUOTA_EXHAUSTED_RPD" ||
      (httpStatus === 429 &&
        /daily|diario|rpd|perday|mañana|tomorrow/i.test(message));

    const isRpm =
      code === "RATE_LIMIT_RPM" || (httpStatus === 429 && !isRpd);

    if (isRpd) {
      setQuotaStatus("rpd_exhausted");
      setRpmSecondsLeft(0);
      setError(t.quota.rpdBannerBody);
      try {
        localStorage.setItem(RPD_DATE_KEY, getTodayKey());
        localStorage.removeItem(RPM_UNTIL_KEY);
      } catch {
        // Ignore
      }
      pushToast(t.toasts.rateLimitTitle, t.quota.rpdBannerBody, "error");
      return;
    }

    if (isRpm) {
      const waitSeconds = Math.max(5, payload.retryAfterSeconds ?? 60);
      setQuotaStatus("rpm_limited");
      setRpmSecondsLeft(waitSeconds);
      setError(message);
      try {
        localStorage.setItem(
          RPM_UNTIL_KEY,
          String(Date.now() + waitSeconds * 1000)
        );
      } catch {
        // Ignore
      }
      pushToast(
        t.toasts.rateLimitTitle,
        t.quota.rpmBannerBody.replace("{seconds}", String(waitSeconds)),
        "warning"
      );
      return;
    }

    if (
      code === "FILE_TOO_LARGE" ||
      code === "UNSUPPORTED_FORMAT" ||
      code === "FILE_READ_FAILED" ||
      httpStatus === 413
    ) {
      setError(message);
      pushToast(t.toasts.uploadFailedTitle, message, "error");
      return;
    }

    setError(message);
  };

  const handleTranscribe = async (overrideMode?: TranscriptionMode) => {
    if (quotaStatus !== "available") return;

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

      let response: Response;
      try {
        response = await fetch("/api/transcribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UI-Lang": uiLang,
          },
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
      } catch (networkErr) {
        if ((networkErr as Error)?.name === "AbortError") {
          return;
        }
        setError(t.errors.networkError);
        pushToast(t.toasts.networkErrorTitle, t.errors.networkError, "error");
        return;
      }

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok || !contentType.includes("text/event-stream")) {
        const errPayload = (await response
          .json()
          .catch(() => ({}))) as ApiErrorPayload;

        const retryHeader = Number(response.headers.get("Retry-After") || 0);
        if (retryHeader > 0 && !errPayload.retryAfterSeconds) {
          errPayload.retryAfterSeconds = retryHeader;
        }

        applyServerErrorPayload(errPayload, response.status);
        return;
      }

      if (!response.body) {
        setError(t.errors.emptyStream);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let handledErrorEvent = false;

      const processEventChunk = (eventChunk: string) => {
        const lines = eventChunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const rawJson = line.slice(6).trim();
          if (!rawJson) continue;
          let parsed: {
            text?: string;
            done?: boolean;
            error?: string;
            code?: ErrorCode;
            status?: number;
            retryAfterSeconds?: number;
          };
          try {
            parsed = JSON.parse(rawJson);
          } catch {
            continue;
          }

          if (parsed.error) {
            handledErrorEvent = true;
            applyServerErrorPayload(parsed, parsed.status);
            return;
          }
          if (parsed.text) {
            accumulated += parsed.text;
            setTranscriptionText(accumulated);
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
          if (handledErrorEvent) break;
        }
        if (handledErrorEvent) break;
      }

      if (!handledErrorEvent && buffer.trim()) {
        processEventChunk(buffer);
      }

      if (handledErrorEvent) return;

      if (accumulated.trim()) {
        setSessionProcessedCount((c) => c + 1);
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
      const message =
        err instanceof Error ? err.message : t.errors.unexpectedError;
      setError(message);
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
                quotaStatus={quotaStatus}
                rpmSecondsLeft={rpmSecondsLeft}
                sessionProcessedCount={sessionProcessedCount}
                onResetQuotaStatus={handleResetQuotaStatus}
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

      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        dismissLabel={t.toasts.dismiss}
      />
    </div>
  );
}
