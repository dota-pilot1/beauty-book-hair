"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, RefreshCw, X, Loader2, LayoutList, LayoutGrid } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { uploadImage } from "@/shared/api/upload";
import {
  useAdminGallery,
  useCreateGallery,
  useUpdateGallery,
  useToggleGalleryPublish,
  useDeleteGallery,
} from "@/entities/gallery/model/useGallery";
import type { GalleryItem, GalleryPhotoType, GalleryTag } from "@/entities/gallery/model/types";
import { GALLERY_PHOTO_TYPE_LABEL, GALLERY_TAG_LABEL } from "@/entities/gallery/model/types";

const TAG_OPTIONS: GalleryTag[] = ["CUT", "PERM", "COLOR", "TREATMENT", "SCALP", "STYLING", "ETC"];
const PHOTO_TYPE_OPTIONS: GalleryPhotoType[] = ["BA", "MODEL"];

const TAG_BADGE: Record<GalleryTag, string> = {
  CUT:       "bg-sky-100 text-sky-700",
  PERM:      "bg-violet-100 text-violet-700",
  COLOR:     "bg-amber-100 text-amber-700",
  TREATMENT: "bg-emerald-100 text-emerald-700",
  SCALP:     "bg-teal-100 text-teal-700",
  STYLING:   "bg-pink-100 text-pink-700",
  ETC:       "bg-muted text-muted-foreground",
};

const PHOTO_TYPE_BADGE: Record<GalleryPhotoType, string> = {
  BA:    "bg-blue-100 text-blue-700",
  MODEL: "bg-purple-100 text-purple-700",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

// ── 이미지 업로더 컴포넌트 ───────────────────────────────────────────────────

function ImageUploader({
  label,
  required,
  value,
  onChange,
  onUploadingChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await uploadImage(file, "gallery");
      onChange(url);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = ""; // 같은 파일 다시 선택 가능하도록 reset
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  const handleClick = () => inputRef.current?.click();
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {value ? (
        // 이미지가 있을 때 — 미리보기 + 액션 버튼
        <div
          className="group relative h-44 w-full rounded-md overflow-hidden border border-border bg-muted cursor-pointer"
          onClick={handleClick}
        >
          <Image src={value} alt={label} fill className="object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          {/* hover 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              다시 선택
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
            >
              <X className="h-3.5 w-3.5" />
              제거
            </button>
          </div>
          {/* 우상단 X 버튼 (항상 노출) */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
            title="제거"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        // 이미지가 없을 때 — 드롭존
        <div
          onClick={handleClick}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">업로드 중...</p>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background border border-border">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">클릭하거나 드래그하여 업로드</p>
              <p className="mt-0.5 text-xs text-muted-foreground">PNG, JPG, WebP</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── 다중 이미지 업로더 ───────────────────────────────────────────────────────

const MAX_IMAGES = 10;

function MultiImageUploader({
  label,
  required,
  values,
  onChange,
  onUploadingChange,
}: {
  label: string;
  required?: boolean;
  values: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = async (files: File[]) => {
    const remaining = MAX_IMAGES - values.length;
    if (remaining <= 0) return;
    const accepted = files.filter((f) => f.type.startsWith("image/")).slice(0, remaining);
    if (accepted.length === 0) return;
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const uploaded = await Promise.all(accepted.map((f) => uploadImage(f, "gallery")));
      onChange([...values, ...uploaded]);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) void uploadFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) void uploadFiles(files);
  };

  const removeAt = (idx: number) => onChange(values.filter((_, i) => i !== idx));
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...values];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const canAdd = values.length < MAX_IMAGES;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium text-muted-foreground">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-xs text-muted-foreground">
          {values.length} / {MAX_IMAGES}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-2">
        {values.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="group relative aspect-square rounded-md overflow-hidden border border-border bg-muted"
          >
            <Image src={url} alt={`${label} ${idx + 1}`} fill className="object-cover" />
            {idx === 0 && (
              <span className="absolute top-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                대표
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-foreground hover:bg-white"
                  title="앞으로"
                >
                  ▲
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="rounded-md bg-rose-500/90 px-2 py-1 text-[10px] font-medium text-white hover:bg-rose-500"
              >
                제거
              </button>
            </div>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-[11px] text-muted-foreground">추가</p>
              </>
            )}
          </button>
        )}
      </div>
      {values.length > 0 && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          첫 번째 이미지가 목록 대표로 사용됩니다. ▲ 버튼으로 순서 변경 가능합니다.
        </p>
      )}
    </div>
  );
}

// ── 업로드 폼 다이얼로그 ─────────────────────────────────────────────────────

type FormState = {
  title: string;
  description: string;
  imageUrls: string[];
  beforeImageUrl: string;
  designerName: string;
  tag: GalleryTag;
  photoType: GalleryPhotoType;
  isPublished: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  imageUrls: [],
  beforeImageUrl: "",
  designerName: "",
  tag: "ETC",
  photoType: "BA",
  isPublished: true,
};

function GalleryFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  initial?: FormState;
  onClose: () => void;
  onSubmit: (form: FormState) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-8 rounded-md border border-black/12 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
          <h3 className="text-base font-semibold">
            {initial ? "갤러리 수정" : "갤러리 등록"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* 제목 */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">제목 *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="예: 내추럴 펌 before/after"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 이미지 업로드 — Before(단일) | After(다중) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <ImageUploader
                label="Before 이미지 (선택)"
                value={form.beforeImageUrl}
                onChange={(url) => set("beforeImageUrl", url)}
                onUploadingChange={setUploading}
              />
            </div>
            <div>
              <MultiImageUploader
                label="After 이미지 (여러 장 가능)"
                required
                values={form.imageUrls}
                onChange={(urls) => setForm((f) => ({ ...f, imageUrls: urls }))}
                onUploadingChange={setUploading}
              />
            </div>
          </div>

          {/* 사진 유형 + 스타일 태그 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">사진 유형</label>
              <select
                value={form.photoType}
                onChange={(e) => set("photoType", e.target.value as GalleryPhotoType)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PHOTO_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{GALLERY_PHOTO_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">스타일 태그</label>
              <select
                value={form.tag}
                onChange={(e) => set("tag", e.target.value as GalleryTag)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>{GALLERY_TAG_LABEL[t]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 디자이너명 */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">디자이너명 (선택)</label>
            <input
              value={form.designerName}
              onChange={(e) => set("designerName", e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">설명 (선택)</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="시술 설명을 입력하세요"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* 공개 여부 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-foreground">바로 공개</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-black/8 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            취소
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.title.trim() || form.imageUrls.length === 0 || isPending || uploading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isPending || uploading ? "처리 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function GalleryManagementPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAdminGallery(page);

  const createGallery = useCreateGallery();
  const updateGallery = useUpdateGallery();
  const togglePublish = useToggleGalleryPublish();
  const deleteGallery = useDeleteGallery();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<GalleryItem | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("card");

  const handleCreate = (form: FormState) => {
    createGallery.mutate(
      {
        title: form.title,
        description: form.description || undefined,
        imageUrls: form.imageUrls,
        beforeImageUrl: form.beforeImageUrl || undefined,
        designerName: form.designerName || undefined,
        tag: form.tag,
        photoType: form.photoType,
        isPublished: form.isPublished,
      },
      { onSuccess: () => setShowForm(false) }
    );
  };

  const handleUpdate = (form: FormState) => {
    if (!editTarget) return;
    updateGallery.mutate(
      {
        id: editTarget.id,
        body: {
          title: form.title,
          description: form.description || undefined,
          imageUrls: form.imageUrls,
          beforeImageUrl: form.beforeImageUrl || undefined,
          designerName: form.designerName || undefined,
          tag: form.tag,
          photoType: form.photoType,
          isPublished: form.isPublished,
        },
      },
      { onSuccess: () => setEditTarget(null) }
    );
  };

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <RequireAuth>
      <AdminShell
        title="갤러리 관리"
        description="시술 사진과 포트폴리오를 등록하고 관리합니다."
      >
        {/* 목록 영역 상단 — 토글 + 총 개수 + 버튼 */}
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 items-stretch rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("card")}
                className={`flex items-center px-2.5 transition-colors ${viewMode === "card" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                title="카드 뷰"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <div className="w-px bg-border" />
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center px-2.5 transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                title="목록 뷰"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              총 <span className="font-semibold text-foreground">{data?.totalElements ?? 0}</span>건
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 shrink-0"
          >
            + 사진 등록
          </button>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">등록된 갤러리 항목이 없습니다.</p>
        ) : viewMode === "card" ? (
          // ── 카드 뷰 ────────────────────────────────────────────────────
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-md border border-black/12 bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* 이미지 영역 */}
                  <div
                    onClick={() => setEditTarget(item)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-muted cursor-pointer"
                  >
                    {item.imageUrls[0] && (
                      <Image src={item.imageUrls[0]} alt={item.title} fill className="object-cover" />
                    )}
                    {item.imageUrls.length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                        +{item.imageUrls.length - 1}
                      </span>
                    )}
                    <span className={`absolute top-2 left-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${PHOTO_TYPE_BADGE[item.photoType]}`}>
                      {GALLERY_PHOTO_TYPE_LABEL[item.photoType]}
                    </span>
                    <span className={`absolute top-2 right-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${TAG_BADGE[item.tag]}`}>
                      {GALLERY_TAG_LABEL[item.tag]}
                    </span>
                    {/* 공개 토글 (좌하단) */}
                    <button
                      onClick={() => togglePublish.mutate(item.id)}
                      className={`absolute bottom-2 left-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        item.isPublished
                          ? "bg-emerald-500/90 text-white hover:bg-emerald-600"
                          : "bg-black/60 text-white hover:bg-black/80"
                      }`}
                    >
                      {item.isPublished ? "공개" : "숨김"}
                    </button>
                  </div>

                  {/* 정보 영역 */}
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="truncate text-sm font-semibold text-foreground" title={item.title}>
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.designerName ?? "디자이너 미지정"} · {formatDate(item.createdAt)}
                      </p>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => setEditTarget(item)}
                        className="flex-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("삭제하시겠습니까?")) deleteGallery.mutate(item.id);
                        }}
                        className="flex-1 rounded-md border border-rose-200 px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                      i === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          // ── 테이블 뷰 ──────────────────────────────────────────────────
          <div className="rounded-md border border-black/12 bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 w-16">이미지</th>
                  <th className="px-4 py-3">제목</th>
                  <th className="px-4 py-3 w-24">유형</th>
                  <th className="px-4 py-3 w-24">태그</th>
                  <th className="px-4 py-3 w-24">디자이너</th>
                  <th className="px-4 py-3 w-20 text-center">공개</th>
                  <th className="px-4 py-3 w-24">등록일</th>
                  <th className="px-4 py-3 w-32 text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-black/6 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-12 rounded-md overflow-hidden border border-border">
                        {item.imageUrls[0] && (
                          <Image src={item.imageUrls[0]} alt={item.title} fill className="object-cover" />
                        )}
                        {item.imageUrls.length > 1 && (
                          <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/60 px-1 text-[9px] font-medium text-white">
                            +{item.imageUrls.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[220px] truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${PHOTO_TYPE_BADGE[item.photoType]}`}>
                        {GALLERY_PHOTO_TYPE_LABEL[item.photoType]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${TAG_BADGE[item.tag]}`}>
                        {GALLERY_TAG_LABEL[item.tag]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.designerName ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePublish.mutate(item.id)}
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                          item.isPublished
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {item.isPublished ? "공개" : "숨김"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditTarget(item)}
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted whitespace-nowrap"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("삭제하시겠습니까?")) deleteGallery.mutate(item.id);
                          }}
                          className="rounded-md border border-rose-200 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 whitespace-nowrap"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 border-t border-black/8 px-4 py-3">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                      i === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </AdminShell>

      {/* 등록 폼 */}
      <GalleryFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        isPending={createGallery.isPending}
      />

      {/* 수정 폼 */}
      {editTarget && (
        <GalleryFormDialog
          open={true}
          initial={{
            title: editTarget.title,
            description: editTarget.description ?? "",
            imageUrls: editTarget.imageUrls ?? [],
            beforeImageUrl: editTarget.beforeImageUrl ?? "",
            designerName: editTarget.designerName ?? "",
            tag: editTarget.tag,
            photoType: editTarget.photoType,
            isPublished: editTarget.isPublished,
          }}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
          isPending={updateGallery.isPending}
        />
      )}
    </RequireAuth>
  );
}
