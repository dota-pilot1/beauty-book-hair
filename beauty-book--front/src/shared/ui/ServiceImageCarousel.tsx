"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  imageUrls?: string[] | null;
  alt: string;
  aspectClass?: string;
  containerClassName?: string;
  placeholder?: React.ReactNode;
}

export function ServiceImageCarousel({
  imageUrls,
  alt,
  aspectClass = "aspect-[16/10]",
  containerClassName = "",
  placeholder,
}: Props) {
  const [current, setCurrent] = useState(0);

  const images = imageUrls ?? [];

  if (images.length === 0) {
    return <>{placeholder ?? null}</>;
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c + 1) % images.length);
  };

  return (
    <div className={`relative overflow-hidden ${aspectClass} ${containerClassName}`}>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${images[current]})` }}
        aria-label={`${alt} ${current + 1}/${images.length}`}
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-0 h-full w-1/2 cursor-pointer"
            aria-label="이전 이미지"
          />
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-0 h-full w-1/2 cursor-pointer"
            aria-label="다음 이미지"
          />
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white pointer-events-none">
            <ChevronLeft className="h-2.5 w-2.5" />
            {current + 1} / {images.length}
            <ChevronRight className="h-2.5 w-2.5" />
          </span>
        </>
      )}
    </div>
  );
}
