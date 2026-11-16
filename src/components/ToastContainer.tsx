import React from "react";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { ToastNotification } from "../types/paleography";

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  dismissLabel: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  dismissLabel,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="pointer-events-none fixed right-5 bottom-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const styles =
          toast.variant === "warning"
            ? "border-amber-300 bg-amber-50 text-amber-950"
            : toast.variant === "info"
              ? "border-stone-300 bg-white text-[#1C1917]"
              : "border-red-300 bg-red-50 text-red-950";

        const Icon =
          toast.variant === "warning"
            ? AlertTriangle
            : toast.variant === "info"
              ? Info
              : AlertCircle;

        const iconColor =
          toast.variant === "warning"
            ? "text-amber-700"
            : toast.variant === "info"
              ? "text-stone-700"
              : "text-red-700";

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 border p-3.5 shadow-lg ${styles}`}
          >
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-semibold">{toast.title}</p>
              <p className="mt-0.5 leading-relaxed opacity-90">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label={dismissLabel}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
