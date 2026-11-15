import React from "react";
import { Upload } from "lucide-react";
import { UiDictionary } from "../i18n/translations";

interface TopBarProps {
  onUploadClick: () => void;
  historyCount: number;
  t: UiDictionary;
}

export const TopBar: React.FC<TopBarProps> = ({
  onUploadClick,
  historyCount,
  t,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-[#FBF9F5]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5 lg:px-10">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#workbench"
          className="font-serif text-2xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B2E14]"
        >
          Scriptorium
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600"
        >
          <a
            href="#workbench"
            className="hover:text-[#1C1917] hover:underline underline-offset-4 decoration-stone-300 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.workbench}
          </a>
          <a
            href="#specimens"
            className="hover:text-[#1C1917] hover:underline underline-offset-4 decoration-stone-300 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.specimens}
          </a>
          <a
            href="#standards"
            className="hover:text-[#1C1917] hover:underline underline-offset-4 decoration-stone-300 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.standards}
          </a>
          <a
            href="#archive-log"
            className="hover:text-[#1C1917] hover:underline underline-offset-4 decoration-stone-300 transition-colors whitespace-nowrap shrink-0 tabular-nums"
          >
            {t.nav.archiveLog}
            {historyCount > 0 ? ` (${historyCount})` : ""}
          </a>
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 rounded-md bg-[#8B2E14] px-4 py-2 text-xs font-semibold text-[#FBF9F5] transition-colors duration-150 hover:bg-[#73240F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B2E14] whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.nav.uploadFolio}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
