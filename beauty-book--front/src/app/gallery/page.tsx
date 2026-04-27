"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { usePublicGallery } from "@/entities/gallery/model/useGallery";
import type { GalleryItem, GalleryTag } from "@/entities/gallery/model/types";
import { GALLERY_TAG_LABEL } from "@/entities/gallery/model/types";

const TAG_OPTIONS: Array<{ value: GalleryTag | "ALL"; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "CUT", label: "커트" },
  { value: "PERM", label: "펌" },
  { value: "COLOR", label: "컬러" },
  { value: "TREATMENT", label: "트리트먼트" },
  { value: "SCALP", label: "두피케어" },
  { value: "STYLING", label: "스타일링" },
  { value: "ETC", label: "기타" },
];

const TAG_BADGE_COLOR: Record<GalleryTag, string> = {
  CUT:       "bg-sky-100 text-sky-700",
  PERM:      "bg-violet-100 text-violet-700",
  COLOR:     "bg-amber-100 text-amber-700",
  TREATMENT: "bg-emerald-100 text-emerald-700",
  SCALP:     "bg-teal-100 text-teal-700",
  STYLING:   "bg-pink-100 text-pink-700",
  ETC:       "bg-muted text-muted-foreground",
};

// ── After 이미지 캐러셀 (상세 모달용) ───────────────────────────────────────

function AfterCarousel({ images, label }: { images: string[]; label: string }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % images.length);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-neutral-100 via-neutral-50 to-white">
      <Image
        src={images[idx]}
        alt={`${label} ${idx + 1}`}
        fill
        className="object-contain"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
      {images.length > 1 && (
        <>
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
            <button
              type="button"
              onClick={prev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-black hover:bg-black/30 transition-colors"
              aria-label="이전"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-black hover:bg-black/30 transition-colors"
              aria-label="다음"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`${i + 1}번 이미지`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── 상세 모달 — 더 크게, Before|After 동시 표시 ─────────────────────────────

function GalleryDetailModal({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  const hasBefore = !!item.beforeImageUrl;
  const afterImages = item.imageUrls ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border border-black/12 bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 (우상단 절대 위치) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 이미지 영역 — Before(좌, 단일) | After(우, 캐러셀) */}
        <div className="relative w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex-shrink-0">
          {hasBefore ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-slate-700/50">
              <div className="relative aspect-[4/3] lg:aspect-[4/5]">
                <Image
                  src={item.beforeImageUrl!}
                  alt="Before"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                  Before
                </span>
              </div>
              <div className="relative aspect-[4/3] lg:aspect-[4/5]">
                <AfterCarousel images={afterImages} label="After" />
                <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                  After {afterImages.length > 1 ? `(${afterImages.length}장)` : ""}
                </span>
              </div>
            </div>
          ) : (
            <div className="relative aspect-[16/10]">
              <AfterCarousel images={afterImages} label={item.title} />
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="px-6 py-4 space-y-2 overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{item.title}</h2>
              {item.designerName && (
                <p className="mt-0.5 text-sm text-muted-foreground">디자이너 · {item.designerName}</p>
              )}
            </div>
            <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TAG_BADGE_COLOR[item.tag]}`}>
              {GALLERY_TAG_LABEL[item.tag]}
            </span>
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 갤러리 카드 ──────────────────────────────────────────────────────────────

function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const thumb = item.imageUrls?.[0];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-black/10 bg-card shadow-sm hover:shadow-md transition-all duration-200 text-left"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {thumb && (
          <Image
            src={thumb}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {item.beforeImageUrl && (
          <span className="absolute top-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            B/A
          </span>
        )}
        {item.imageUrls.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            +{item.imageUrls.length - 1}
          </span>
        )}
        <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${TAG_BADGE_COLOR[item.tag]}`}>
          {GALLERY_TAG_LABEL[item.tag]}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        {item.designerName && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.designerName}</p>
        )}
      </div>
    </button>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [selectedTag, setSelectedTag] = useState<GalleryTag | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [detailItem, setDetailItem] = useState<GalleryItem | null>(null);

  const { data, isLoading } = usePublicGallery(
    selectedTag === "ALL" ? undefined : selectedTag,
    undefined,
    page
  );

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleTagChange = (tag: GalleryTag | "ALL") => {
    setSelectedTag(tag);
    setPage(0);
  };

  return (
    <CustomerShell
      eyebrow="Gallery"
      title="시술 갤러리"
      description="디자이너들의 시술 작품을 확인해보세요."
    >
      {/* 태그 필터 */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TAG_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleTagChange(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedTag === value
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 그리드 */}
      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">등록된 갤러리가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <GalleryCard key={item.id} item={item} onClick={() => setDetailItem(item)} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                i === page
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {detailItem && (
        <GalleryDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}
    </CustomerShell>
  );
}
