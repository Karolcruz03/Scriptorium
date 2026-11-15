import { LanguageHint, TranscriptionMode } from "../types/paleography";

export type UiLang = "es" | "en";

export interface UiDictionary {
  pageTitle: string;
  nav: {
    workbench: string;
    specimens: string;
    standards: string;
    archiveLog: string;
    uploadFolio: string;
  };
  masthead: {
    kicker: string;
    title: string;
    subtitle: string;
    switchToEnglish: string;
    switchToSpanish: string;
    interfaceLabel: string;
  };
  viewer: {
    ariaLabel: string;
    zoomOut: string;
    zoomIn: string;
    rotate: string;
    reset: string;
    resetAria: string;
    opticalGroupAria: string;
    filters: {
      original: string;
      highContrast: string;
      bleedReduction: string;
      inverted: string;
    };
    errorText: string;
    selectFile: string;
    dropTitle: string;
    dropSubtitle: string;
    replaceImage: string;
  };
  desk: {
    ariaLabel: string;
    languageGroupAria: string;
    modeGroupAria: string;
    languages: Record<LanguageHint, string>;
    modes: Record<TranscriptionMode, string>;
    options: string;
    stop: string;
    transcribeFolio: string;
    preserveLineBreaks: string;
    includeMarginalia: string;
    customInstructionLabel: string;
    customInstructionPlaceholder: string;
    editionLabels: Record<TranscriptionMode, string>;
    words: string;
    transcribingStatus: string;
    lines: string;
    proofread: string;
    readingView: string;
    errorTitle: string;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
    streamingWait: string;
    marginaliaHeading: string;
    analysisHeading: string;
    deriveLabel: string;
    deriveNormalized: string;
    deriveTranslate: string;
    deriveAnalysis: string;
    copyText: string;
    copied: string;
  };
  specimensSection: {
    kicker: string;
    title: string;
    subtitle: string;
    activeButton: string;
    loadButton: string;
  };
  standardsSection: {
    kicker: string;
    title: string;
    subtitle: string;
    items: {
      index: string;
      title: string;
      body: string;
    }[];
  };
  historySection: {
    kicker: string;
    title: string;
    clearLog: string;
    emptyTitle: string;
    emptyBody: string;
    open: string;
    removeAria: string;
  };
  footer: {
    tagline: string;
  };
  errors: {
    invalidFileType: string;
    loadFileError: string;
    emptyStream: string;
    unexpectedError: string;
  };
  uploadMeta: {
    defaultTitle: string;
    subtitlePrefix: string;
  };
  specimenCopy: Record<
    string,
    {
      title: string;
      dateLabel: string;
      languageLabel: string;
      scriptType: string;
      description: string;
    }
  >;
}

export const TRANSLATIONS: Record<UiLang, UiDictionary> = {
  es: {
    pageTitle: "Scriptorium — Paleografía Archivística y HTR",
    nav: {
      workbench: "Mesa de trabajo",
      specimens: "Especímenes",
      standards: "Normas",
      archiveLog: "Registro",
      uploadFolio: "Subir folio",
    },
    masthead: {
      kicker: "Paleografía en español · latín · inglés",
      title: "Mesa de transcripción paleográfica diplomática",
      subtitle:
        "Cargue, arrastre o pegue cualquier digitalización archivística. Preserva la ortografía original, grafías históricas, saltos de línea y notas marginales separadas.",
      switchToEnglish: "English",
      switchToSpanish: "Español",
      interfaceLabel: "Idioma de la interfaz",
    },
    viewer: {
      ariaLabel: "Visor de inspección de manuscritos",
      zoomOut: "Alejar",
      zoomIn: "Acercar",
      rotate: "Rotar 90 grados",
      reset: "Restablecer",
      resetAria: "Restablecer aumento y posición",
      opticalGroupAria: "Mejora óptica de tinta",
      filters: {
        original: "Original",
        highContrast: "Alto contraste",
        bleedReduction: "Reducir traspaso",
        inverted: "Tinta invertida",
      },
      errorText:
        "No se pudo renderizar esta imagen archivística. Arrastre un nuevo escaneo aquí o cargue un archivo.",
      selectFile: "Seleccionar manuscrito",
      dropTitle: "Suelte el manuscrito para inspeccionarlo",
      dropSubtitle: "Admite imágenes archivísticas JPG, PNG, WEBP y GIF",
      replaceImage: "Reemplazar imagen",
    },
    desk: {
      ariaLabel: "Mesa de transcripción paleográfica",
      languageGroupAria: "Idioma del manuscrito",
      modeGroupAria: "Modo de edición",
      languages: {
        auto: "Auto",
        spanish: "Español",
        english: "Inglés",
        latin: "Latín",
      },
      modes: {
        diplomatic: "Diplomática",
        normalized: "Normalizada",
        translation: "Traducción",
        analysis: "Análisis",
      },
      options: "Opciones",
      stop: "Detener",
      transcribeFolio: "Transcribir folio",
      preserveLineBreaks:
        "Conservar saltos de línea originales y estructura de párrafos",
      includeMarginalia: "Separar notas al margen en [Marginalia]",
      customInstructionLabel: "Instrucción erudita (opcional)",
      customInstructionPlaceholder:
        "Ej.: Desarrollar abreviaturas latinas o traducir la posdata",
      editionLabels: {
        diplomatic: "Edición diplomática",
        normalized: "Edición normalizada",
        translation: "Traducción",
        analysis: "Análisis paleográfico",
      },
      words: "palabras",
      transcribingStatus: "Transcribiendo folio…",
      lines: "Líneas",
      proofread: "Corregir",
      readingView: "Vista lectura",
      errorTitle: "Transcripción interrumpida",
      emptyTitle: "Listo para transcripción paleográfica",
      emptyBody:
        "Seleccione un idioma de referencia o déjelo en Auto y transcriba el folio activo. La ortografía original, la ese larga («ſ»), las abreviaturas arcaicas y las notas marginales se conservan fielmente.",
      emptyCta: "Transcribir este folio",
      streamingWait:
        "Examinando trazos, densidad de tinta y notas marginales…",
      marginaliaHeading: "Marginalia",
      analysisHeading: "Análisis paleográfico e histórico",
      deriveLabel: "Derivar:",
      deriveNormalized: "Normalizada",
      deriveTranslate: "Traducir",
      deriveAnalysis: "Análisis histórico",
      copyText: "Copiar texto",
      copied: "Copiado",
    },
    specimensSection: {
      kicker: "Colección de referencia",
      title: "Bóveda de especímenes",
      subtitle:
        "Seleccione un folio archivístico para inspeccionar su caligrafía, aplicar filtros ópticos de tinta y ejecutar una transcripción diplomática.",
      activeButton: "Activo en mesa",
      loadButton: "Cargar folio",
    },
    standardsSection: {
      kicker: "Protocolo diplomático",
      title: "Normas de transcripción paleográfica",
      subtitle:
        "Cada folio procesado en Scriptorium sigue las convenciones archivísticas diplomáticas para manuscritos en español, latín e inglés.",
      items: [
        {
          index: "01",
          title: "Fidelidad ortográfica",
          body: "Conserva la ortografía original, grafías históricas, puntuación y uso de mayúsculas de manera literal salvo que se solicite expresamente una versión normalizada.",
        },
        {
          index: "02",
          title: "Notación de lagunas y daños",
          body: "Los pasajes completamente ilegibles se señalan como [illegible], mientras que las palabras parcialmente dañadas o borrosas se anotan con conjetura como [damaged: posible palabra].",
        },
        {
          index: "03",
          title: "Lineación y estructura del folio",
          body: "Mantiene las divisiones de párrafo y los saltos de línea originales del escribano para cotejar cada renglón directamente frente al escaneo.",
        },
        {
          index: "04",
          title: "Separación de marginalia",
          body: "Las adiciones interlineales, glosas escolásticas y anotaciones en los márgenes se transcriben en una sección independiente encabezada por [Marginalia].",
        },
        {
          index: "05",
          title: "Recuperación de grafías y tintas",
          body: "Descifra ligaduras cursivas complejas, tinta ferrogálica desvanecida, traspaso del verso, ese larga («ſ») y abreviaturas paleográficas latinas o castellanas.",
        },
        {
          index: "06",
          title: "Salida textual depurada",
          body: "Emite únicamente la transcripción limpia sin comentarios añadidos, reservando las traducciones y el análisis histórico para peticiones explícitas.",
        },
      ],
    },
    historySection: {
      kicker: "Registro de sesión",
      title: "Bitácora de archivo",
      clearLog: "Limpiar bitácora",
      emptyTitle: "Aún no hay transcripciones registradas en esta sesión.",
      emptyBody:
        "Las transcripciones completadas se guardan localmente aquí para comparar ediciones o volver a folios anteriores.",
      open: "Abrir",
      removeAria: "Eliminar de la bitácora",
    },
    footer: {
      tagline:
        "Mesa diplomática HTR para archivos históricos en español, latín e inglés",
    },
    errors: {
      invalidFileType:
        "Seleccione un archivo de imagen válido (JPG, PNG, WEBP o GIF).",
      loadFileError: "No se pudo cargar el archivo seleccionado.",
      emptyStream: "Flujo de respuesta vacío desde el servidor.",
      unexpectedError:
        "Ocurrió un error inesperado durante la transcripción.",
    },
    uploadMeta: {
      defaultTitle: "Folio archivístico cargado",
      subtitlePrefix: "Carga local de manuscrito",
    },
    specimenCopy: {
      "sevilla-1642": {
        title: "Despacho sobre logística de la Flota Real, Sevilla",
        dateLabel: "14 de marzo de 1642",
        languageLabel: "Español histórico",
        scriptType: "Cursiva bastarda española del siglo XVII",
        description:
          "Firmada por Diego de Vargas y Castro con ese larga («ſ»), fórmulas de cortesía abreviadas (Q.B.V.M., affmo:), filigrana real tenue y nota en el margen izquierdo.",
      },
      "latin-codex-23r": {
        title: "Comentario al Prólogo de San Juan, Fol. 23r",
        dateLabel: "Siglo XIV",
        languageLabel: "Latín medieval",
        scriptType: "Escritura gótica textualis con iniciales rubricadas",
        description:
          "Inicial «I» iluminada en bermellón, signos medievales de suspensión y títuli, ese larga («ſ») y glosas escolásticas marginales con cita a San Agustín.",
      },
      "london-1847": {
        title: "Carta de H. Thornton sobre conservación de manuscritos",
        dateLabel: "18 de octubre de 1847",
        languageLabel: "Inglés del siglo XIX",
        scriptType: "Cursiva inglesa copperplate victoriana",
        description:
          "Correspondencia en tinta sepia sobre papel de trapo crema doblado, con pliegue horizontal central, leve moteado de humedad y despedida epistolar de época.",
      },
    },
  },
  en: {
    pageTitle: "Scriptorium — Archival Paleography & HTR",
    nav: {
      workbench: "Workbench",
      specimens: "Specimen Vault",
      standards: "Standards",
      archiveLog: "Archive Log",
      uploadFolio: "Upload Folio",
    },
    masthead: {
      kicker: "Spanish · Latin · English Paleography",
      title: "Diplomatic Manuscript Transcription Workbench",
      subtitle:
        "Upload, drop, or paste any archival scan. Preserves original orthography, historical letterforms, line breaks, and separated marginalia.",
      switchToEnglish: "English",
      switchToSpanish: "Español",
      interfaceLabel: "Interface language",
    },
    viewer: {
      ariaLabel: "Manuscript inspection viewer",
      zoomOut: "Zoom out",
      zoomIn: "Zoom in",
      rotate: "Rotate 90 degrees",
      reset: "Reset",
      resetAria: "Reset zoom and position",
      opticalGroupAria: "Optical ink enhancement",
      filters: {
        original: "Original",
        highContrast: "High Contrast",
        bleedReduction: "Bleed Reduction",
        inverted: "Inverted Ink",
      },
      errorText:
        "This archival image could not be rendered. Drop a new manuscript scan here or upload a file.",
      selectFile: "Select Manuscript File",
      dropTitle: "Drop manuscript scan to inspect",
      dropSubtitle: "Supports JPG, PNG, WEBP, and GIF archival images",
      replaceImage: "Replace Image",
    },
    desk: {
      ariaLabel: "Paleographic transcription desk",
      languageGroupAria: "Manuscript language",
      modeGroupAria: "Output edition mode",
      languages: {
        auto: "Auto",
        spanish: "Spanish",
        english: "English",
        latin: "Latin",
      },
      modes: {
        diplomatic: "Diplomatic",
        normalized: "Normalized",
        translation: "Translation",
        analysis: "Analysis",
      },
      options: "Options",
      stop: "Stop",
      transcribeFolio: "Transcribe Folio",
      preserveLineBreaks:
        "Preserve original line breaks & paragraph structure",
      includeMarginalia: "Separate margin notes into [Marginalia]",
      customInstructionLabel: "Scholarly instruction (optional)",
      customInstructionPlaceholder:
        "e.g., Expand Latin abbreviations or translate postscript",
      editionLabels: {
        diplomatic: "Diplomatic Edition",
        normalized: "Normalized Edition",
        translation: "Translation",
        analysis: "Paleographic Analysis",
      },
      words: "words",
      transcribingStatus: "Transcribing folio…",
      lines: "Lines",
      proofread: "Proofread",
      readingView: "Reading View",
      errorTitle: "Transcription Interrupted",
      emptyTitle: "Ready for Paleographic Transcription",
      emptyBody:
        "Select a language hint or leave on Auto, then transcribe the active folio. Original orthography, long s ('ſ'), archaic abbreviations, and margin notes are preserved verbatim.",
      emptyCta: "Transcribe This Folio",
      streamingWait:
        "Examining letterforms, ink density, and marginalia…",
      marginaliaHeading: "Marginalia",
      analysisHeading: "Paleographic & Historical Analysis",
      deriveLabel: "Derive:",
      deriveNormalized: "Normalized",
      deriveTranslate: "Translate",
      deriveAnalysis: "Historical Analysis",
      copyText: "Copy Text",
      copied: "Copied",
    },
    specimensSection: {
      kicker: "Reference Collection",
      title: "Specimen Vault",
      subtitle:
        "Select an archival folio below to inspect its calligraphy, apply optical ink filters, and run diplomatic transcription.",
      activeButton: "Active in Workbench",
      loadButton: "Load Folio",
    },
    standardsSection: {
      kicker: "Diplomatic Protocol",
      title: "Paleographic Transcription Standards",
      subtitle:
        "Every folio processed in Scriptorium adheres to archival diplomatic conventions for Spanish, Latin, and English manuscripts.",
      items: [
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
      ],
    },
    historySection: {
      kicker: "Session Register",
      title: "Archive Log",
      clearLog: "Clear Session Log",
      emptyTitle: "No transcriptions recorded in this session yet.",
      emptyBody:
        "Completed folio transcriptions are saved locally here so you can compare editions or return to earlier pages.",
      open: "Open",
      removeAria: "Remove from log",
    },
    footer: {
      tagline:
        "Diplomatic HTR Workbench for Historical Spanish, Latin, and English Archives",
    },
    errors: {
      invalidFileType:
        "Please select a valid image file (JPG, PNG, WEBP, or GIF).",
      loadFileError: "Unable to load selected file.",
      emptyStream: "Empty response stream from server.",
      unexpectedError:
        "An unexpected error occurred during transcription.",
    },
    uploadMeta: {
      defaultTitle: "Uploaded Archival Folio",
      subtitlePrefix: "Local Manuscript Upload",
    },
    specimenCopy: {
      "sevilla-1642": {
        title: "Dispatch on Royal Fleet Logistics, Sevilla",
        dateLabel: "14 March 1642",
        languageLabel: "Historical Spanish",
        scriptType: "17th-century Spanish bastarda cursive",
        description:
          "Signed by Diego de Vargas y Castro with long s ('ſ'), archaic honorific abbreviations (Q.B.V.M., affmo:), faint crown watermark, and left-margin gloss.",
      },
      "latin-codex-23r": {
        title: "Commentary on the Prologue of John, Fol. 23r",
        dateLabel: "14th Century",
        languageLabel: "Medieval Latin",
        scriptType: "Gothic textualis with rubricated initials",
        description:
          "Illuminated vermilion initial 'I', dense medieval suspension marks and tituli, long s ('ſ'), and twin scholastic marginal glosses referencing Augustine.",
      },
      "london-1847": {
        title: "H. Thornton Letter on Manuscript Conservation",
        dateLabel: "18 October 1847",
        languageLabel: "19th-Century English",
        scriptType: "Victorian copperplate cursive",
        description:
          "Sepia ink correspondence on folded cream rag paper exhibiting a central horizontal crease, faint foxing, and period epistolary closing.",
      },
    },
  },
};
