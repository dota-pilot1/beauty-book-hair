"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { beautyServiceCategoryApi } from "@/entities/beauty-service-category/api/beautyServiceCategoryApi";
import type { BeautyServiceCategory } from "@/entities/beauty-service/model/types";
import { toast, toastError } from "@/shared/lib/toast";

const createSchema = z.object({
  code: z.string().min(1, "코드를 입력해주세요.").regex(/^[A-Z][A-Z0-9_]*$/, "대문자/숫자/언더스코어 형식이어야 합니다.").optional(),
  name: z.string().min(1, "이름을 입력해주세요.").max(80),
  description: z.string().max(255).optional(),
  visible: z.boolean(),
  displayOrder: z.number().min(0).optional(),
});

const updateSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "이름을 입력해주세요.").max(80),
  description: z.string().max(255).optional(),
  visible: z.boolean(),
  displayOrder: z.number().min(0).optional(),
});

type CategoryFormValues = {
  code?: string;
  name: string;
  description?: string;
  visible: boolean;
  displayOrder?: number;
};

type Props = {
  open: boolean;
  category?: BeautyServiceCategory | null;
  onClose: () => void;
};

export function BeautyServiceCategoryFormDialog({ open, category, onClose }: Props) {
  const isEdit = !!category;
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      isEdit
        ? {
            name: category.name,
            description: category.description ?? "",
            visible: category.visible,
            displayOrder: category.displayOrder,
          }
        : {
            code: "",
            name: "",
            description: "",
            visible: true,
            displayOrder: 0,
          }
    );
  }, [open, isEdit, category, reset]);

  const mutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      isEdit
        ? beautyServiceCategoryApi.update(category!.id, {
            name: values.name,
            description: values.description,
            visible: values.visible,
            displayOrder: values.displayOrder ?? 0,
          })
        : beautyServiceCategoryApi.create({
            code: values.code!,
            name: values.name,
            description: values.description,
            visible: values.visible,
            displayOrder: values.displayOrder,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "카테고리가 수정되었습니다." : "카테고리가 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["beauty-service-categories"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-md border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold">{isEdit ? "카테고리 수정" : "카테고리 등록"}</h2>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          {!isEdit ? (
            <Field label="코드" error={errors.code?.message as string}>
              <input {...register("code")} placeholder="CUT" className={inputCls} />
            </Field>
          ) : (
            <div>
              <span className="text-xs text-muted-foreground">코드</span>
              <p className="mt-0.5 font-mono text-sm">{category!.code}</p>
            </div>
          )}

          <Field label="이름" error={errors.name?.message as string}>
            <input {...register("name")} placeholder="컷" className={inputCls} />
          </Field>

          <Field label="설명" error={errors.description?.message as string}>
            <input {...register("description")} placeholder="기본 컷, 레이어드 컷 등" className={inputCls} />
          </Field>

          <Field label="표시 순서" error={errors.displayOrder?.message as string}>
            <input type="number" {...register("displayOrder")} className={inputCls} />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("visible")} className="h-4 w-4" />
            고객 화면에 노출
          </label>

          <div className="flex justify-end gap-2 pt-2">
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
