"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Upload, Loader2, Trash2 } from "lucide-react";
import { siteSettingApi } from "@/entities/site-setting/api/siteSettingApi";
import { uploadImage } from "@/shared/api/upload";
import { toast, toastError } from "@/shared/lib/toast";

const schema = z.object({
  introTitle: z
    .string()
    .min(1, "소개 제목을 입력해주세요.")
    .max(200, "200자 이내로 입력해주세요."),
  introSubtitle: z
    .string()
    .min(1, "소개 문구를 입력해주세요.")
    .max(500, "500자 이내로 입력해주세요."),
});

type FormValues = z.infer<typeof schema>;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

export function SiteSettingsForm() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: siteSettingApi.get,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { introTitle: "", introSubtitle: "" },
  });

  useEffect(() => {
    if (data) {
      reset({
        introTitle: data.introTitle,
        introSubtitle: data.introSubtitle,
      });
      setHeroImageUrl(data.heroImageUrl);
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      siteSettingApi.update({
        heroImageUrl,
        introTitle: values.introTitle,
        introSubtitle: values.introSubtitle,
      }),
    onSuccess: (fresh) => {
      toast.success("메인 설정이 저장되었습니다.");
      qc.setQueryData(["site-settings"], fresh);
      reset({
        introTitle: fresh.introTitle,
        introSubtitle: fresh.introSubtitle,
      });
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("PNG, JPG, WEBP, GIF 이미지만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file, "site");
      setHeroImageUrl(url);
      toast.success("이미지가 업로드되었습니다. 저장을 눌러 반영하세요.");
    } catch (err) {
      toastError(err, "이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setHeroImageUrl(null);
  };

  const hasChanges = isDirty || heroImageUrl !== (data?.heroImageUrl ?? null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
      className="space-y-6"
    >
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">
            대문 이미지
          </label>
          <span className="text-xs text-muted-foreground">
            PNG/JPG/WEBP/GIF · 최대 {MAX_SIZE_MB}MB
          </span>
        </div>

        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30">
          <div className="relative aspect-[16/9] w-full">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt="대문 이미지"
                fill
                className="object-cover"
                unoptimized
                sizes="(max-width: 768px) 100vw, 640px"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-10 w-10" />
                <span className="text-xs">등록된 이미지가 없습니다.</span>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-foreground" />
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" />
            {heroImageUrl ? "이미지 교체" : "이미지 업로드"}
          </button>
          {heroImageUrl && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              이미지 제거
            </button>
          )}
        </div>
      </section>

      <section className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">
          소개 제목
        </label>
        <textarea
          {...register("introTitle")}
          rows={2}
          placeholder="예: 팀을 위한&#10;깔끔한 인증 보일러플레이트"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground">
          줄바꿈은 실제 화면에도 그대로 반영됩니다.
        </p>
        {errors.introTitle && (
          <span className="block text-xs text-destructive">
            {errors.introTitle.message}
          </span>
        )}
      </section>

      <section className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">
          소개 문구
        </label>
        <textarea
          {...register("introSubtitle")}
          rows={3}
          placeholder="서비스를 한두 문장으로 소개해주세요."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        {errors.introSubtitle && (
          <span className="block text-xs text-destructive">
            {errors.introSubtitle.message}
          </span>
        )}
      </section>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="submit"
          disabled={isSubmitting || saveMutation.isPending || !hasChanges}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saveMutation.isPending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
