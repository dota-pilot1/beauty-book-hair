"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { beautyServiceCategoryApi } from "@/entities/beauty-service-category/api/beautyServiceCategoryApi";
import { beautyServiceApi } from "@/entities/beauty-service/api/beautyServiceApi";
import type {
  BeautyService,
  BeautyServiceTargetGender,
} from "@/entities/beauty-service/model/types";
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

export function BeautyServiceFormDialog({ open, beautyService, defaultCategoryId, onClose }: Props) {
  const isEdit = !!beautyService;
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ["beauty-service-categories", "options"],
    queryFn: () => beautyServiceCategoryApi.list({ visible: true }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BeautyServiceFormValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
  });

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
          }
    );
  }, [open, isEdit, beautyService, defaultCategoryId, reset, categories]);

  const mutation = useMutation({
    mutationFn: (values: BeautyServiceFormValues) =>
      isEdit
        ? beautyServiceApi.update(beautyService!.id, values)
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
          }),
    onSuccess: () => {
      toast.success(isEdit ? "시술이 수정되었습니다." : "시술이 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["beauty-services"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold">{isEdit ? "시술 수정" : "시술 등록"}</h2>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
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
            <input {...register("description")} placeholder="간단한 시술 설명" className={inputCls} />
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
