"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Upload, Trash2 } from "lucide-react";
import { beautyServiceCategoryApi } from "@/entities/beauty-service-category/api/beautyServiceCategoryApi";
import { beautyServiceApi } from "@/entities/beauty-service/api/beautyServiceApi";
import type {
  BeautyService,
  BeautyServiceTargetGender,
} from "@/entities/beauty-service/model/types";
import { uploadImage } from "@/shared/api/upload";
import { toast, toastError } from "@/shared/lib/toast";

const createSchema = z.object({
  code: z.string().min(1, "코드를 입력해주세요.").regex(/^[A-Z][A-Z0-9_]*$/, "대문자/숫자/언더스코어 형식이어야 합니다."),
  name: z.string().min(1, "이름을 입력해주세요.").max(120),
  categoryId: z.coerce.number().min(1, "카테고리를 선택해주세요."),
  description: z.string().max(500).optional(),
  durationMinutes: z.coerce.number().min(5).max(1440),
  price: z.coerce.number().min(0),
  targetGender: z.enum(["ALL", "WOMEN", "MEN"]),
  visible: z.boolean(),
  displayOrder: z.coerce.number().min(0),
  imageUrls: z.array(z.string()).max(10).optional(),
});

const updateSchema = createSchema.omit({ code: true });

type BeautyServiceFormValues = {
  code?: string;
  name: string;
  categoryId: number;
  description?: string;
  durationMinutes: number;
  price: number;
  targetGender: BeautyServiceTargetGender;
  visible: boolean;
  displayOrder: number;
  imageUrls?: string[];
};

type Props = {
  open: boolean;
  beautyService?: BeautyService | null;
  defaultCategoryId?: number | null;
  onClose: () => void;
};

const genders: Array<{ value: BeautyServiceTargetGender; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "WOMEN", label: "여성" },
  { value: "MEN", label: "남성" },
];

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;
const MAX_IMAGE_COUNT = 10;

export function BeautyServiceFormDialog({ open, beautyService, defaultCategoryId, onClose }: Props) {
  const isEdit = !!beautyService;
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ["beauty-service-categories", "options"],
    queryFn: () => beautyServiceCategoryApi.list({ visible: true }),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BeautyServiceFormValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema) as Resolver<BeautyServiceFormValues>,
  });
  const imageUrls = useWatch({ control, name: "imageUrls" }) ?? [];

  useEffect(() => {
    if (!open) return;
    reset(
      isEdit
        ? {
            name: beautyService.name,
            categoryId: beautyService.category.id,
            description: beautyService.description ?? "",
            durationMinutes: beautyService.durationMinutes,
            price: beautyService.price,
            targetGender: beautyService.targetGender,
            visible: beautyService.visible,
            displayOrder: beautyService.displayOrder,
            imageUrls: beautyService.imageUrls ?? [],
          }
        : {
            code: "",
            name: "",
            categoryId: defaultCategoryId ?? categories[0]?.id ?? 0,
            description: "",
            durationMinutes: 60,
            price: 0,
            targetGender: "ALL",
            visible: true,
            displayOrder: 0,
            imageUrls: [],
          }
    );
  }, [open, isEdit, beautyService, defaultCategoryId, reset, categories]);

  const mutation = useMutation({
    mutationFn: (values: BeautyServiceFormValues) =>
      isEdit
        ? beautyServiceApi.update(beautyService!.id, { ...values, imageUrls: values.imageUrls ?? [] })
        : beautyServiceApi.create({
            code: values.code!,
            name: values.name,
            categoryId: values.categoryId,
            description: values.description,
            durationMinutes: values.durationMinutes,
            price: values.price,
            targetGender: values.targetGender,
            visible: values.visible,
            displayOrder: values.displayOrder,
            imageUrls: values.imageUrls ?? [],
          }),
    onSuccess: () => {
      toast.success(isEdit ? "시술이 수정되었습니다." : "시술이 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["beauty-services"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    if (imageUrls.length + files.length > MAX_IMAGE_COUNT) {
      toast.error(`이미지는 최대 ${MAX_IMAGE_COUNT}개까지 등록할 수 있습니다.`);
      return;
    }

    const invalidType = files.find((file) => !ALLOWED_TYPES.includes(file.type));
    if (invalidType) {
      toast.error("PNG, JPG, WEBP, GIF 이미지만 업로드할 수 있습니다.");
      return;
    }

    const oversized = files.find((file) => file.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      toast.error(`파일 크기는 개당 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }

    setIsUploading(true);
    try {
      const urls = await Promise.all(files.map((file) => uploadImage(file, "beauty-services")));
      setValue("imageUrls", [...imageUrls, ...urls], { shouldDirty: true });
      toast.success("이미지가 업로드되었습니다. 저장을 눌러 반영하세요.");
    } catch (err) {
      toastError(err, "이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (url: string) => {
    setValue("imageUrls", imageUrls.filter((imageUrl) => imageUrl !== url), { shouldDirty: true });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold">{isEdit ? "시술 수정" : "시술 등록"}</h2>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <div className="space-y-4">
            {!isEdit ? (
              <Field label="코드" error={errors.code?.message as string}>
                <input {...register("code")} placeholder="LAYERED_CUT" className={inputCls} />
              </Field>
            ) : (
              <div>
                <span className="text-xs text-muted-foreground">코드</span>
                <p className="mt-0.5 font-mono text-sm">{beautyService!.code}</p>
              </div>
            )}

            <Field label="이름" error={errors.name?.message as string}>
              <input {...register("name")} placeholder="레이어드 컷" className={inputCls} />
            </Field>

            <Field label="카테고리" error={errors.categoryId?.message as string}>
              <select {...register("categoryId")} className={inputCls}>
                <option value="">카테고리 선택</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="설명" error={errors.description?.message as string}>
              <textarea
                {...register("description")}
                rows={5}
                placeholder="간단한 시술 설명"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="소요 시간(분)" error={errors.durationMinutes?.message as string}>
                <input type="number" {...register("durationMinutes")} className={inputCls} />
              </Field>
              <Field label="가격" error={errors.price?.message as string}>
                <input type="number" {...register("price")} className={inputCls} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="대상" error={errors.targetGender?.message as string}>
                <select {...register("targetGender")} className={inputCls}>
                  {genders.map((gender) => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="표시 순서" error={errors.displayOrder?.message as string}>
                <input type="number" {...register("displayOrder")} className={inputCls} />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("visible")} className="h-4 w-4" />
              고객 화면에 노출
            </label>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">상세 이미지</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG/JPG/WEBP/GIF, 개당 {MAX_SIZE_MB}MB, 최대 {MAX_IMAGE_COUNT}개
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || imageUrls.length >= MAX_IMAGE_COUNT}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
              >
                {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                이미지 추가
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(",")}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-dashed border-border bg-muted/30">
              {imageUrls[0] ? (
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${imageUrls[0]})` }}
                  aria-label="대표 상세 이미지"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-xs">상세 이미지를 등록하세요.</span>
                </div>
              )}

              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                </div>
              ) : null}
            </div>

            {imageUrls.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {imageUrls.map((url, index) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                    <div
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${url})` }}
                      aria-label={`상세 이미지 ${index + 1}`}
                    />
                    {index === 0 ? (
                      <span className="absolute left-1 top-1 rounded-sm bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
                        대표
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-sm bg-background/90 text-destructive opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      aria-label={`상세 이미지 ${index + 1} 삭제`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <div className="flex justify-end gap-2 border-t border-border pt-4 lg:col-span-2">
            <button type="button" onClick={onClose} className={cancelCls}>
              취소
            </button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className={submitCls}>
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const cancelCls =
  "rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent";
const submitCls =
  "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60";
