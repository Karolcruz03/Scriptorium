import React, { useRef, useState, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Upload,
  ScrollText,
  Eye,
} from "lucide-react";
import { ActiveDocument, OpticalFilter } from "../types/paleography";
import { UiDictionary } from "../i18n/translations";

interface ManuscriptViewerProps {
  document: ActiveDocument;
  onFileSelected: (file: File) => void;
  onTriggerUpload: () => void;
  t: UiDictionary;
}

function getFilterCss(filter: OpticalFilter): string {
  switch (filter) {
    case "high-contrast":
      return "contrast(1.45) brightness(1.04) saturate(0.85)";
    case "bleed-reduction":
      return "grayscale(1) contrast(1.65) brightness(1.12)";
    case "inverted":
      return "invert(1) contrast(1.25) hue-rotate(180deg)";
    case "original":
    default:
      return "none";
  }
}

export const ManuscriptViewer: React.FC<ManuscriptViewerProps> = ({
  document,
  onFileSelected,
  onTriggerUpload,
  t,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFileHovering, setIsFileHovering] = useState<boolean>(false);
  const [opticalFilter, setOpticalFilter] = useState<OpticalFilter>("original");
  const [imgError, setImgError] = useState<boolean>(false);

  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const filterOptions: { id: OpticalFilter; label: string }[] = [
    { id: "original", label: t.viewer.filters.original },
    { id: "high-contrast", label: t.viewer.filters.highContrast },
    { id: "bleed-reduction", label: t.viewer.filters.bleedReduction },
    { id: "inverted", label: t.viewer.filters.inverted },
  ];

  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setImgError(false);
  }, [document.id, document.imageUrl]);

  const handleZoomIn = () => setZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, Number((z - 0.25).toFixed(2))));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.12 : -0.12;
      setZoom((z) => Math.min(4, Math.max(0.4, Number((z + delta).toFixed(2)))));
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragOriginRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragOriginRef.current.x,
      y: e.clientY - dragOriginRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer already released
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) {
      setIsFileHovering(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileHovering(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileHovering(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <section
      aria-label={t.viewer.ariaLabel}
      className="flex h-full flex-col border border-stone-200 bg-white"
    >
      {/* Top Inspection Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-[#F6F3EC] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label={t.viewer.zoomOut}
            title={t.viewer.zoomOut}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-stone-200 bg-white text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[3.25rem] text-center font-mono text-xs font-medium text-stone-700 tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label={t.viewer.zoomIn}
            title={t.viewer.zoomIn}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-stone-200 bg-white text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            aria-label={t.viewer.rotate}
            title={t.viewer.rotate}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded border border-stone-200 bg-white text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 cursor-pointer"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            aria-label={t.viewer.resetAria}
            title={t.viewer.reset}
            className="inline-flex h-9 items-center gap-1.5 rounded border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.viewer.reset}</span>
          </button>
        </div>

        {/* Paleographic Optical Enhancement Controls */}
        <div
          role="group"
          aria-label={t.viewer.opticalGroupAria}
          className="flex flex-wrap items-center gap-1 rounded-md bg-stone-200/70 p-0.5"
        >
          <Eye className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-stone-500 hidden sm:block" aria-hidden="true" />
          {filterOptions.map((opt) => {
            const active = opticalFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setOpticalFilter(opt.id)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? "bg-white text-[#1C1917] shadow-xs"
                    : "text-stone-600 hover:text-[#1C1917]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conservation Dark Mat Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex min-h-[480px] lg:min-h-[580px] flex-1 w-full items-center justify-center overflow-hidden bg-[#1D1B19] select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {!imgError ? (
          <img
            src={document.imageUrl}
            alt={document.title}
            referrerPolicy="no-referrer"
            draggable={false}
            onError={() => setImgError(true)}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
              filter: getFilterCss(opticalFilter),
              transition: isDragging ? "none" : "transform 160ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="max-h-[92%] max-w-[92%] object-contain shadow-2xl will-change-transform"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-stone-300">
            <ScrollText className="h-10 w-10 text-stone-400" aria-hidden="true" />
            <p className="font-serif text-xl text-stone-200">{document.title}</p>
            <p className="max-w-xs text-xs text-stone-400">
              {t.viewer.errorText}
            </p>
            <button
              type="button"
              onClick={onTriggerUpload}
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-stone-600 bg-stone-800 px-4 py-2 text-xs font-medium text-stone-100 hover:bg-stone-700 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.viewer.selectFile}</span>
            </button>
          </div>
        )}

        {/* Drag-and-Drop Overlay */}
        {isFileHovering && (
          <div className="pointer-events-none absolute inset-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#D6CEBE] bg-[#1D1B19]/90 text-[#FBF9F5]">
            <Upload className="h-7 w-7 text-[#D6CEBE]" aria-hidden="true" />
            <p className="font-serif text-xl font-medium">{t.viewer.dropTitle}</p>
            <p className="text-xs text-stone-300">{t.viewer.dropSubtitle}</p>
          </div>
        )}
      </div>

      {/* Museum Figure Caption Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-[#FBF9F5] px-4 py-3 text-xs text-stone-600">
        <div className="min-w-0">
          <p className="truncate font-serif text-base font-semibold text-[#1C1917]">
            {document.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-stone-500">
            {document.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onTriggerUpload}
          className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t.viewer.replaceImage}</span>
        </button>
      </div>
    </section>
  );
};
