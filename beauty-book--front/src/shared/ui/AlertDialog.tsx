"use client";

import { useEffect, useRef } from "react";

type Variant = "warning" | "error" | "info";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel?: () => void;
};

const variantStyles: Record<Variant, { icon: string; btnClass: string }> = {
  warning: {
    icon: "⚠️",
    btnClass: "bg-yellow-500 text-white hover:opacity-90",
  },
  error: {
    icon: "🚫",
    btnClass: "bg-rose-600 text-white hover:bg-rose-700",
  },
  info: {
    icon: "ℹ️",
    btnClass: "bg-primary text-primary-foreground hover:opacity-90",
  },
};

export function AlertDialog({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  variant = "warning",
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => cancelRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div className="w-full max-w-sm rounded-xl border border-black/15 bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl leading-none mt-0.5">{styles.icon}</span>
          <div className="flex-1">
            <h2 id="alert-dialog-title" className="text-sm font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-1.5 text-xs text-foreground/55 whitespace-pre-line leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          {onCancel && (
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="h-8 rounded-md border border-black/15 px-4 text-xs font-medium text-foreground/60 hover:border-black/25 hover:text-foreground transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`h-8 rounded-md px-4 text-xs font-semibold transition-colors ${styles.btnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
