import sampleSpanishLetter from "../assets/images/sample_spanish_letter_1794714246744.jpg";
import sampleLatinCodex from "../assets/images/sample_latin_codex_1794714247012.jpg";
import sampleEnglishCorrespondence from "../assets/images/sample_english_correspondence_1794714245429.jpg";
import { ManuscriptSpecimen } from "../types/paleography";

export const SPECIMENS: ManuscriptSpecimen[] = [
  {
    id: "sevilla-1642",
    title: "Dispatch on Royal Fleet Logistics, Sevilla",
    dateLabel: "14 March 1642",
    languageLabel: "Historical Spanish",
    languageHint: "spanish",
    repository: "Archivo de Indias",
    shelfmark: "MS Esp. 1642-B",
    scriptType: "17th-century Spanish bastarda cursive",
    description:
      "Signed by Diego de Vargas y Castro with long s ('ſ'), archaic honorific abbreviations (Q.B.V.M., affmo:), faint crown watermark, and left-margin gloss.",
    imageUrl: sampleSpanishLetter,
  },
  {
    id: "latin-codex-23r",
    title: "Commentary on the Prologue of John, Fol. 23r",
    dateLabel: "14th Century",
    languageLabel: "Medieval Latin",
    languageHint: "latin",
    repository: "Biblioteca Capitular",
    shelfmark: "Cod. Lat. 23r",
    scriptType: "Gothic textualis with rubricated initials",
    description:
      "Illuminated vermilion initial 'I', dense medieval suspension marks and tituli, long s ('ſ'), and twin scholastic marginal glosses referencing Augustine.",
    imageUrl: sampleLatinCodex,
  },
  {
    id: "london-1847",
    title: "H. Thornton Letter on Manuscript Conservation",
    dateLabel: "18 October 1847",
    languageLabel: "19th-Century English",
    languageHint: "english",
    repository: "Private Correspondence",
    shelfmark: "Box IV, Fol. 19",
    scriptType: "Victorian copperplate cursive",
    description:
      "Sepia ink correspondence on folded cream rag paper exhibiting a central horizontal crease, faint foxing, and period epistolary closing.",
    imageUrl: sampleEnglishCorrespondence,
  },
];

export const EDITORIAL_STANDARDS = [
  {
    index: "01",
    title: "Orthographic Fidelity",
    body: "Preserves original spelling, historical orthography, punctuation, and capitalization verbatim unless a normalized edition is explicitly requested.",
  },
  {
    index: "02",
    title: "Lacuna & Damage Notation",
    body: "Completely unreadable passages are recorded as [illegible], while partially obscured or abraded words are bracketed with conjectures as [damaged: possible word].",
  },
  {
    index: "03",
    title: "Lineation & Folio Structure",
    body: "Maintains the scribe's original paragraph divisions and line breaks so scholars can cross-reference each line directly against the manuscript scan.",
  },
  {
    index: "04",
    title: "Marginalia Separation",
    body: "Interlinear additions, scholastic glosses, and outer-margin annotations are extracted into a dedicated [Marginalia] section following the main body.",
  },
  {
    index: "05",
    title: "Archaic Glyph & Ink Recovery",
    body: "Deciphers complex cursive ligatures, fading iron-gall ink, verso bleed-through, long s ('ſ'), and Latin or Spanish paleographic abbreviations.",
  },
  {
    index: "06",
    title: "Unadulterated Output",
    body: "Emits only the clean scholarly transcription without unsolicited commentary, reserving translations and historical notes for explicit requests.",
  },
];
