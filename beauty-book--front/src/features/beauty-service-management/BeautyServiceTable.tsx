"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Images, LayoutGrid, Plus, Table2, Trash2 } from "lucide-react";
import { beautyServiceApi } from "@/entities/beauty-service/api/beautyServiceApi";
import type { BeautyService, BeautyServiceCategory } from "@/entities/beauty-service/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { BeautyServiceFormDialog } from "./BeautyServiceFormDialog";
import { ServiceImageDialog } from "@/shared/ui/ServiceImageDialog";

type Props = {
  selectedCategoryId: number | null;
  selectedCategory?: BeautyServiceCategory | null;
};

export function BeautyServiceTable({ selectedCategoryId, selectedCategory }: Props) {
  const qc = useQueryClient();
  const [formTarget, setFormTarget] = useState<BeautyService | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<BeautyService | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [imageDialog, setImageDialog] = useState<{ urls: string[]; alt: string } | null>(null);

  const { data: services, isLoading, isError } = useQuery({
    queryKey: ["beauty-services", selectedCategoryId],
    queryFn: () => beautyServiceApi.list(selectedCategoryId ? { categoryId: selectedCategoryId } : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => beautyServiceApi.delete(id),
    onSuccess: () => {
      toast.success("시술이 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["beauty-services"] });
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => beautyServiceApi.deleteBatch(ids),
    onSuccess: () => {
      toast.success("선택한 시술이 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["beauty-services"] });
      setSelectedIds(new Set());
      setBatchDeleteOpen(false);
    },
    onError: (e) => toastError(e, "일괄 삭제에 실패했습니다."),
  });

  const visibilityMutation = useMutation({
    mutationFn: (service: BeautyService) =>
      beautyServiceApi.update(service.id, {
        name: service.name,
        categoryId: service.category.id,
        description: service.description ?? undefined,
        durationMinutes: service.durationMinutes,
        price: service.price,
        targetGender: service.targetGender,
        visible: !service.visible,
        displayOrder: service.displayOrder,
        imageUrls: service.imageUrls ?? [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beauty-services"] });
    },
    onError: (e) => toastError(e, "노출 상태 변경에 실패했습니다."),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  if (isError) return <p className="text-sm text-destructive">데이터를 불러오지 못했습니다.</p>;

  return (
    <section className="min-w-0 rounded-md border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">
            {selectedCategory ? `${selectedCategory.name} 시술` : "시술 목록"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedCategory ? selectedCategory.description || "선택한 카테고리의 시술입니다." : "전체 시술을 관리합니다."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setBatchDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-destructive/50 bg-background px-3 py-2 text-sm font-medium text-destructive shadow-sm hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              {selectedIds.size}개 삭제
            </button>
          )}
          <button
            onClick={() => setFormTarget("new")}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            시술 등록
          </button>
        </div>
      </div>

      <div className="flex px-5 pt-5">
        <div className="inline-flex rounded-md border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`inline-flex h-8 w-8 items-center justify-center rounded ${viewMode === "card" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="카드 보기"
            title="카드 보기"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex h-8 w-8 items-center justify-center rounded ${viewMode === "table" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="테이블 보기"
            title="테이블 보기"
          >
            <Table2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="mx-5 mb-5 mt-3 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th className="w-10">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={
                      (services?.length ?? 0) > 0 &&
                      services?.filter((s) => !s.hasActiveReservations).every((s) => selectedIds.has(s.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(services?.filter((s) => !s.hasActiveReservations).map((s) => s.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </Th>
                <Th>이름</Th>
                <Th>카테고리</Th>
                <Th>소요 시간</Th>
                <Th>가격</Th>
                <Th>대상</Th>
                <Th>노출</Th>
                <Th>예약</Th>
                <Th className="text-right">액션</Th>
              </tr>
            </thead>
            <tbody>
              {services?.length === 0 ? (
                <tr>
                  <Td colSpan={8} className="py-10 text-center text-muted-foreground">
                    등록된 시술이 없습니다.
                  </Td>
                </tr>
              ) : null}
              {services?.map((service) => (
                <tr key={service.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <Td>
                    {service.hasActiveReservations ? (
                      <span title="활성 예약 있음" className="inline-block h-4 w-4 rounded border border-border bg-muted/40 cursor-not-allowed" />
                    ) : (
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedIds.has(service.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          e.target.checked ? next.add(service.id) : next.delete(service.id);
                          setSelectedIds(next);
                        }}
                      />
                    )}
                  </Td>
                  <Td className="font-medium">{service.name}</Td>
                  <Td>{service.category.name}</Td>
                  <Td>{service.durationMinutes}분</Td>
                  <Td>{Number(service.price).toLocaleString()}원</Td>
                  <Td>{genderLabel(service.targetGender)}</Td>
                  <Td>{service.visible ? "노출" : "숨김"}</Td>
                  <Td>
                    {service.hasActiveReservations ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                        예약 있음
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                        없음
                      </span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <ServiceActions
                      service={service}
                      onEdit={setFormTarget}
                      onDelete={setDeleteTarget}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 px-5 pb-5 pt-3 md:grid-cols-2 xl:grid-cols-3">
          {services?.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
              등록된 시술이 없습니다.
            </div>
          ) : null}
          {services?.map((service) => (
            <article key={service.id} className="overflow-hidden rounded-md border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              {service.imageUrls?.[0] ? (
                <div
                  className="relative aspect-[16/9] cursor-pointer border-b border-border"
                  onClick={() => setImageDialog({ urls: service.imageUrls!, alt: service.name })}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${service.imageUrls[0]})` }}
                    aria-label={`${service.name} 대표 이미지`}
                  />
                  {service.imageUrls.length > 1 && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <Images className="h-3 w-3" />
                      {service.imageUrls.length}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center border-b border-border bg-muted/50">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-background shadow-sm">
                      <ImagePlus className="h-5 w-5" />
                    </span>
                    <span className="text-xs">이미지 미등록</span>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{service.name}</h3>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{service.code}</p>
                  </div>
                  <VisibilityToggle
                    service={service}
                    loading={visibilityMutation.isPending}
                    onToggle={() => visibilityMutation.mutate(service)}
                  />
                </div>

                {service.description ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {service.description}
                  </p>
                ) : (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    시술 설명 입력 예정
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Metric label="카테고리" value={service.category.name} />
                  <Metric label="대상" value={genderLabel(service.targetGender)} />
                  <Metric label="소요 시간" value={`${service.durationMinutes}분`} />
                  <Metric label="가격" value={`${Number(service.price).toLocaleString()}원`} />
                </div>

                <div className="mt-4 flex justify-end">
                  <ServiceActions
                    service={service}
                    onEdit={setFormTarget}
                    onDelete={setDeleteTarget}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {imageDialog && (
        <ServiceImageDialog
          open={true}
          imageUrls={imageDialog.urls}
          alt={imageDialog.alt}
          onClose={() => setImageDialog(null)}
        />
      )}

      <BeautyServiceFormDialog
        open={formTarget !== null}
        beautyService={formTarget === "new" ? null : formTarget}
        defaultCategoryId={selectedCategoryId}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 시술을 삭제하시겠습니까?`}
        description="고객 예약 화면에서 이 시술이 더 이상 보이지 않게 됩니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={batchDeleteOpen}
        title={`${selectedIds.size}개 시술을 삭제하시겠습니까?`}
        description="활성 예약이 있는 시술은 제외하고 삭제됩니다."
        variant="destructive"
        confirmText="삭제"
        loading={batchDeleteMutation.isPending}
        onConfirm={() => batchDeleteMutation.mutate(Array.from(selectedIds))}
        onCancel={() => setBatchDeleteOpen(false)}
      />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border/60 bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

function ServiceActions({
  service,
  onEdit,
  onDelete,
}: {
  service: BeautyService;
  onEdit: (service: BeautyService) => void;
  onDelete: (service: BeautyService) => void;
}) {
  return (
    <div className="inline-flex justify-end gap-2">
      <button
        onClick={() => onEdit(service)}
        className="rounded-sm border border-input bg-background px-2 py-0.5 text-xs shadow-sm hover:bg-accent"
      >
        수정
      </button>
      <button
        onClick={() => !service.hasActiveReservations && onDelete(service)}
        disabled={service.hasActiveReservations}
        title={service.hasActiveReservations ? "활성 예약이 있어 삭제할 수 없습니다" : undefined}
        className={
          service.hasActiveReservations
            ? "rounded-sm border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground cursor-not-allowed opacity-50"
            : "rounded-sm border border-destructive/50 bg-background px-2 py-0.5 text-xs text-destructive shadow-sm hover:bg-destructive/10"
        }
      >
        삭제
      </button>
    </div>
  );
}

function VisibilityToggle({
  service,
  loading,
  onToggle,
}: {
  service: BeautyService;
  loading: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-2 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/40 disabled:opacity-60"
      aria-pressed={service.visible}
      aria-label={`${service.name} ${service.visible ? "숨김 처리" : "노출 처리"}`}
      title={service.visible ? "노출 중" : "숨김"}
    >
      <span className={service.visible ? "text-foreground" : "text-muted-foreground"}>
        {service.visible ? "노출" : "숨김"}
      </span>
      <span
        className={`relative h-4 w-8 overflow-hidden rounded-full transition-colors ${
          service.visible ? "bg-emerald-500" : "bg-muted-foreground/25"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-background shadow-sm transition-transform ${
            service.visible ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left text-xs font-medium text-muted-foreground ${className}`}>{children}</th>;
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return <td colSpan={colSpan} className={`px-4 py-2.5 ${className}`}>{children}</td>;
}

function genderLabel(value: BeautyService["targetGender"]) {
  switch (value) {
    case "WOMEN":
      return "여성";
    case "MEN":
      return "남성";
    default:
      return "전체";
  }
}
