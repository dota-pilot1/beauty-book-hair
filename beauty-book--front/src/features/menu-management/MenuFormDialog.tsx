"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menuApi } from "@/entities/menu/api/menuApi";
import type { MenuRecord } from "@/entities/menu/model/types";
import { toast, toastError } from "@/shared/lib/toast";

type FormValues = {
  code: string;
  parentId: string;
  label: string;
  labelKey: string;
  path: string;
  icon: string;
  isExternal: boolean;
  requiredRole: string;
  visible: boolean;
  displayOrder: number;
};

type Props = {
  target: MenuRecord | "new" | null;
  menus: MenuRecord[];
  onClose: () => void;
};

export function MenuFormDialog({ target, menus, onClose }: Props) {
  const qc = useQueryClient();
  const isNew = target === "new";
  const existing = isNew ? null : (target as MenuRecord);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      code: "",
      parentId: "",
      label: "",
      labelKey: "",
      path: "",
      icon: "",
      isExternal: false,
      requiredRole: "",
      visible: true,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        code: existing.code,
        parentId: existing.parentId?.toString() ?? "",
        label: existing.label,
        labelKey: existing.labelKey ?? "",
        path: existing.path ?? "",
        icon: existing.icon ?? "",
        isExternal: existing.isExternal,
        requiredRole: existing.requiredRole ?? "",
        visible: existing.visible,
        displayOrder: existing.displayOrder,
      });
    } else {
      reset({
        code: "", parentId: "", label: "", labelKey: "",
        path: "", icon: "", isExternal: false,
        requiredRole: "", visible: true, displayOrder: 0,
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const body = {
        parentId: v.parentId ? Number(v.parentId) : null,
        label: v.label,
        labelKey: v.labelKey || null,
        path: v.path || null,
        icon: v.icon || null,
        isExternal: v.isExternal,
        requiredRole: v.requiredRole || null,
        requiredPermission: null,
        visible: v.visible,
        displayOrder: Number(v.displayOrder),
      };
      return isNew
        ? menuApi.create({ code: v.code, ...body })
        : menuApi.update(existing!.id, body);
    },
    onSuccess: () => {
      toast.success(isNew ? "메뉴가 생성되었습니다." : "메뉴가 수정되었습니다.");
      qc.invalidateQueries({ queryKey: ["menus"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  if (!target) return null;

  const roots = menus.filter((m) => m.parentId === null && (!existing || m.id !== existing.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-md border border-border bg-background p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold">
          {isNew ? "메뉴 생성" : "메뉴 수정"}
        </h2>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-3">
          {isNew && (
            <Field label="코드 *">
              <input {...register("code")} required placeholder="DASHBOARD" className={inputCls} />
            </Field>
          )}

          <Field label="부모 메뉴">
            <select {...register("parentId")} className={inputCls}>
              <option value="">없음 (루트)</option>
              {roots.map((m) => (
                <option key={m.id} value={m.id}>{m.label} ({m.code})</option>
              ))}
            </select>
          </Field>

          <Field label="레이블 *">
            <input {...register("label")} required placeholder="대시보드" className={inputCls} />
          </Field>

          <Field label="i18n 키">
            <input {...register("labelKey")} placeholder="nav.dashboard" className={inputCls} />
          </Field>

          <Field label="경로 (URL)">
            <input {...register("path")} placeholder="/dashboard" className={inputCls} />
          </Field>

          <Field label="아이콘">
            <input {...register("icon")} placeholder="LayoutDashboard" className={inputCls} />
          </Field>

          <Field label="필요 역할">
            <input {...register("requiredRole")} placeholder="ROLE_ADMIN" className={inputCls} />
          </Field>

          <Field label="표시 순서">
            <input type="number" {...register("displayOrder")} className={inputCls} />
          </Field>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("visible")} className="h-4 w-4" />
              표시
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("isExternal")} className="h-4 w-4" />
              외부 링크
            </label>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={cancelCls}>
              취소
            </button>
            <button type="submit" disabled={mutation.isPending} className={submitCls}>
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const cancelCls =
  "rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors";
const submitCls =
  "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity";
