"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  imageUrls: string[];
  initialIndex?: number;
  alt: string;
  open: boolean;
  onClose: () => void;
}

export function ServiceImageDialog({ imageUrls, initialIndex = 0, alt, open, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    setCurrent(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + imageUrls.length) % imageUrls.length);
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % imageUrls.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, imageUrls.length, onClose]);

  if (!open) return null;

  const prev = () => setCurrent((c) => (c - 1 + imageUrls.length) % imageUrls.length);
  const next = () => setCurrent((c) => (c + 1) % imageUrls.length);
  const hasManyImages = imageUrls.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-5 py-3">
          <h3 className="truncate text-sm font-medium text-foreground">{alt}</h3>
          <div className="flex items-center gap-3">
            {hasManyImages && (
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {current + 1} / {imageUrls.length}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* 이미지 */}
        <div className="group relative aspect-[4/3] bg-muted/30">
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${imageUrls[current]})` }}
            aria-label={`${alt} ${current + 1}/${imageUrls.length}`}
          />

          {hasManyImages && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-foreground opacity-0 shadow-md transition-all hover:bg-white group-hover:opacity-100"
                aria-label="이전 이미지"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-foreground opacity-0 shadow-md transition-all hover:bg-white group-hover:opacity-100"
                aria-label="다음 이미지"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* 썸네일 (이미지 2장 이상일 때만) */}
        {hasManyImages && (
          <div className="flex shrink-0 justify-center gap-1.5 border-t border-black/[0.06] px-5 py-3">
            {imageUrls.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-md transition-all ${
                  i === current
                    ? "ring-2 ring-primary ring-offset-1"
                    : "opacity-50 hover:opacity-100"
                }`}
                aria-label={`이미지 ${i + 1}`}
              >
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${url})` }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
