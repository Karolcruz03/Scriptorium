import React, { useState } from "react";
import { ScrollText } from "lucide-react";
import { ManuscriptSpecimen } from "../types/paleography";
import { UiDictionary } from "../i18n/translations";

interface SpecimenVaultProps {
  specimens: ManuscriptSpecimen[];
  activeId: string;
  onSelectSpecimen: (specimen: ManuscriptSpecimen) => void;
  t: UiDictionary;
}

export const SpecimenVault: React.FC<SpecimenVaultProps> = ({
  specimens,
  activeId,
  onSelectSpecimen,
  t,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      id="specimens"
      aria-labelledby="specimens-heading"
      className="mx-auto max-w-[1440px] border-t border-stone-200 px-6 py-14 lg:px-10"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
            {t.specimensSection.kicker}
          </p>
          <h2
            id="specimens-heading"
            className="mt-1 font-serif text-3xl font-medium tracking-tight text-[#1C1917]"
          >
            {t.specimensSection.title}
          </h2>
        </div>
        <p className="max-w-md text-sm text-stone-600">
          {t.specimensSection.subtitle}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {specimens.map((specimen) => {
          const isActive = activeId === specimen.id;
          const hasFailed = failedImages[specimen.id];
          const copy = t.specimenCopy[specimen.id] ?? {
            title: specimen.title,
            dateLabel: specimen.dateLabel,
            languageLabel: specimen.languageLabel,
            scriptType: specimen.scriptType,
            description: specimen.description,
          };

          return (
            <article
              key={specimen.id}
              className={`group flex flex-col border transition-colors ${
                isActive
                  ? "border-[#8B2E14] bg-white"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <div className="aspect-[4/3] w-full overflow-hidden border-b border-stone-200 bg-[#1D1B19]">
                {!hasFailed ? (
                  <img
                    src={specimen.imageUrl}
                    alt={copy.title}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({
                        ...prev,
                        [specimen.id]: true,
                      }))
                    }
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-stone-400">
                    <ScrollText className="h-8 w-8" aria-hidden="true" />
                    <span className="font-serif text-sm">{specimen.shelfmark}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                  <span>{copy.languageLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{copy.dateLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{specimen.shelfmark}</span>
                </div>

                <h3 className="mt-2 font-serif text-xl font-semibold text-[#1C1917]">
                  {copy.title}
                </h3>

                <p className="mt-1.5 text-xs font-medium text-stone-600">
                  {copy.scriptType}
                </p>

                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-stone-600">
                  {copy.description}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3.5">
                  <span className="text-xs text-stone-500">
                    {specimen.repository}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectSpecimen(specimen)}
                    className={`rounded px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#8B2E14] text-[#FBF9F5]"
                        : "border border-stone-300 bg-[#FBF9F5] text-[#1C1917] hover:border-[#8B2E14] hover:text-[#8B2E14]"
                    }`}
                  >
                    {isActive
                      ? t.specimensSection.activeButton
                      : t.specimensSection.loadButton}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
