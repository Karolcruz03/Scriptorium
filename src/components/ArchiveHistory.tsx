import React from "react";
import { Trash2, ArrowUpRight } from "lucide-react";
import { TranscriptionRecord } from "../types/paleography";
import { UiDictionary, UiLang } from "../i18n/translations";

interface ArchiveHistoryProps {
  records: TranscriptionRecord[];
  onLoadRecord: (record: TranscriptionRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  t: UiDictionary;
  uiLang: UiLang;
}

export const ArchiveHistory: React.FC<ArchiveHistoryProps> = ({
  records,
  onLoadRecord,
  onDeleteRecord,
  onClearAll,
  t,
  uiLang,
}) => {
  return (
    <section
      id="archive-log"
      aria-labelledby="archive-log-heading"
      className="mx-auto max-w-[1440px] border-t border-stone-200 px-6 py-14 lg:px-10"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
            {t.historySection.kicker}
          </p>
          <h2
            id="archive-log-heading"
            className="mt-1 font-serif text-3xl font-medium tracking-tight text-[#1C1917]"
          >
            {t.historySection.title}
          </h2>
        </div>

        {records.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-400 hover:text-[#1C1917] cursor-pointer"
          >
            {t.historySection.clearLog}
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="border border-stone-200 bg-white px-6 py-10 text-center">
          <p className="font-serif text-lg text-stone-700">
            {t.historySection.emptyTitle}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {t.historySection.emptyBody}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
          {records.map((rec) => {
            const excerpt = rec.text.replace(/\s+/g, " ").trim().slice(0, 140);
            const dateStr = new Date(rec.createdAt).toLocaleTimeString(
              uiLang === "es" ? "es-ES" : "en-US",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            return (
              <div
                key={rec.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 tabular-nums">
                    <span>{t.desk.modes[rec.mode]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t.desk.languages[rec.language]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{dateStr}</span>
                  </div>
                  <h3 className="mt-1 truncate font-serif text-lg font-semibold text-[#1C1917]">
                    {rec.title}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-stone-600">
                    {excerpt}
                    {rec.text.length > 140 ? "…" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoadRecord(rec)}
                    className="inline-flex items-center gap-1 rounded border border-stone-300 bg-[#FBF9F5] px-3 py-1.5 text-xs font-medium text-[#1C1917] transition-colors hover:border-[#8B2E14] hover:text-[#8B2E14] whitespace-nowrap cursor-pointer"
                  >
                    <span>{t.historySection.open}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRecord(rec.id)}
                    aria-label={`${t.historySection.removeAria}: ${rec.title}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-stone-200 bg-white text-stone-500 transition-colors hover:border-red-200 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
