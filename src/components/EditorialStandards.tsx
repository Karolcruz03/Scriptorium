import React from "react";
import { UiDictionary } from "../i18n/translations";

interface EditorialStandardsProps {
  t: UiDictionary;
}

export const EditorialStandards: React.FC<EditorialStandardsProps> = ({ t }) => {
  return (
    <section
      id="standards"
      aria-labelledby="standards-heading"
      className="mx-auto max-w-[1440px] border-t border-stone-200 px-6 py-14 lg:px-10"
    >
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
          {t.standardsSection.kicker}
        </p>
        <h2
          id="standards-heading"
          className="mt-1 font-serif text-3xl font-medium tracking-tight text-[#1C1917]"
        >
          {t.standardsSection.title}
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
          {t.standardsSection.subtitle}
        </p>
      </div>

      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {t.standardsSection.items.map((item) => (
          <div key={item.index} className="border-t border-stone-200 pt-4">
            <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
              <span className="mr-2 font-mono text-xs font-medium text-[#8B2E14] tabular-nums">
                {item.index}.
              </span>
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
