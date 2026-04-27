"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as XLSX from "xlsx";
import { Download, GripVertical, ImagePlus, Images, LayoutGrid, Plus, Table2, Trash2, Upload } from "lucide-react";
import { beautyServiceApi } from "@/entities/beauty-service/api/beautyServiceApi";
import type { BeautyService, BeautyServiceCategory, BeautyServiceTargetGender } from "@/entities/beauty-service/model/types";
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const reorderMutation = useMutation({
    mutationFn: (nextServices: BeautyService[]) =>
      Promise.all(
        nextServices.map((service, index) =>
          beautyServiceApi.update(service.id, {
            name: service.name,
            categoryId: service.category.id,
            description: service.description ?? undefined,
            durationMinutes: service.durationMinutes,
            price: service.price,
            targetGender: service.targetGender,
            visible: service.visible,
            displayOrder: index,
            imageUrls: service.imageUrls ?? [],
          })
        )
      ),
    onMutate: async (nextServices) => {
      await qc.cancelQueries({ queryKey: ["beauty-services", selectedCategoryId] });
      const previous = qc.getQueryData<BeautyService[]>(["beauty-services", selectedCategoryId]);
      qc.setQueryData(
        ["beauty-services", selectedCategoryId],
        nextServices.map((s, i) => ({ ...s, displayOrder: i }))
      );
      return { previous };
    },
    onError: (e, _nextServices, context) => {
      if (context?.previous) {
        qc.setQueryData(["beauty-services", selectedCategoryId], context.previous);
      }
      toastError(e, "순서 변경에 실패했습니다.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beauty-services"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (rows: Parameters<typeof beautyServiceApi.create>[0][]) =>
      Promise.allSettled(rows.map((r) => beautyServiceApi.create(r))),
    onSuccess: (results) => {
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toast.error(`${results.length - failed}개 등록 완료, ${failed}개 실패`);
      } else {
        toast.success(`${results.length}개 시술이 등록되었습니다.`);
      }
      qc.invalidateQueries({ queryKey: ["beauty-services"] });
    },
    onError: (e) => toastError(e, "업로드에 실패했습니다."),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !services) return;

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    reorderMutation.mutate(arrayMove([...services], oldIndex, newIndex));
  };

  const handleDownload = () => {
    const rows = (services ?? []).map((s) => ({
      코드: s.code,
      이름: s.name,
      "소요시간(분)": s.durationMinutes,
      "가격(원)": s.price,
      "대상(전체/여성/남성)": genderLabel(s.targetGender),
      "노출(Y/N)": s.visible ? "Y" : "N",
      설명: s.description ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "시술목록");
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `시술_${selectedCategory?.name ?? "전체"}_${date}.xlsx`);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedCategoryId) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
        if (rows.length === 0) { toast.error("데이터가 없습니다."); return; }

        const baseOrder = services?.length ?? 0;
        const bodies = rows.map((row, i) => ({
          code: String(row["코드"] ?? "").trim(),
          name: String(row["이름"] ?? "").trim(),
          categoryId: selectedCategoryId,
          durationMinutes: Number(row["소요시간(분)"] ?? 0),
          price: Number(row["가격(원)"] ?? 0),
          targetGender: parseGender(row["대상(전체/여성/남성)"]),
          visible: String(row["노출(Y/N)"] ?? "Y").trim().toUpperCase() === "Y",
          displayOrder: baseOrder + i,
          description: row["설명"] ? String(row["설명"]) : undefined,
          imageUrls: [],
        }));

        const invalid = bodies.filter((b) => !b.code || !b.name || !b.durationMinutes || !b.price);
        if (invalid.length > 0) {
          toast.error(`필수값(코드, 이름, 소요시간, 가격) 누락 행이 ${invalid.length}개 있습니다.`);
          return;
        }
        uploadMutation.mutate(bodies);
      } catch {
        toast.error("파일을 읽지 못했습니다. 형식을 확인해주세요.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

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
        <div className="flex flex-wrap items-center gap-2">
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
            onClick={handleDownload}
            disabled={!services?.length}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Excel 다운로드
          </button>
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted/40 ${!selectedCategoryId || uploadMutation.isPending ? "cursor-not-allowed opacity-40" : ""}`}>
            <Upload className="h-4 w-4" />
            {uploadMutation.isPending ? "업로드 중..." : "Excel 업로드"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={!selectedCategoryId || uploadMutation.isPending}
              onChange={handleUpload}
            />
          </label>
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={(services ?? []).map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {viewMode === "table" ? (
            <div className="mx-5 mb-5 mt-3 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <Th className="w-8" />
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
                    <Th className="text-right">액션</Th>
                  </tr>
                </thead>
                <tbody>
                  {(services?.length ?? 0) === 0 ? (
                    <tr>
                      <Td colSpan={9} className="py-10 text-center text-muted-foreground">
                        등록된 시술이 없습니다.
                      </Td>
                    </tr>
                  ) : null}
                  {services?.map((service) => (
                    <SortableServiceRow
                      key={service.id}
                      service={service}
                      selectedIds={selectedIds}
                      onToggleSelect={(id, checked) => {
                        const next = new Set(selectedIds);
                        checked ? next.add(id) : next.delete(id);
                        setSelectedIds(next);
                      }}
                      onEdit={setFormTarget}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 px-5 pb-5 pt-3 md:grid-cols-2 xl:grid-cols-3">
              {(services?.length ?? 0) === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                  등록된 시술이 없습니다.
                </div>
              ) : null}
              {services?.map((service) => (
                <SortableServiceCard
                  key={service.id}
                  service={service}
                  visibilityLoading={visibilityMutation.isPending}
                  onToggleVisibility={() => visibilityMutation.mutate(service)}
                  onImageClick={(urls, alt) => setImageDialog({ urls, alt })}
                  onEdit={setFormTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>

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

function SortableServiceRow({
  service,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  service: BeautyService;
  selectedIds: Set<number>;
  onToggleSelect: (id: number, checked: boolean) => void;
  onEdit: (service: BeautyService) => void;
  onDelete: (service: BeautyService) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });

  const style = {
    opacity: isDragging ? 0.55 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-border last:border-0 hover:bg-muted/20"
    >
      <Td>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-8 w-6 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
          aria-label={`${service.name} 순서 변경`}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </Td>
      <Td>
        {service.hasActiveReservations ? (
          <span title="활성 예약 있음" className="inline-block h-4 w-4 rounded border border-border bg-muted/40 cursor-not-allowed" />
        ) : (
          <input
            type="checkbox"
            className="rounded border-border"
            checked={selectedIds.has(service.id)}
            onChange={(e) => onToggleSelect(service.id, e.target.checked)}
          />
        )}
      </Td>
      <Td className="font-medium">{service.name}</Td>
      <Td>{service.category.name}</Td>
      <Td>{service.durationMinutes}분</Td>
      <Td>{Number(service.price).toLocaleString()}원</Td>
      <Td>{genderLabel(service.targetGender)}</Td>
      <Td>{service.visible ? "노출" : "숨김"}</Td>
      <Td className="text-right">
        <ServiceActions service={service} onEdit={onEdit} onDelete={onDelete} />
      </Td>
    </tr>
  );
}

function SortableServiceCard({
  service,
  visibilityLoading,
  onToggleVisibility,
  onImageClick,
  onEdit,
  onDelete,
}: {
  service: BeautyService;
  visibilityLoading: boolean;
  onToggleVisibility: () => void;
  onImageClick: (urls: string[], alt: string) => void;
  onEdit: (service: BeautyService) => void;
  onDelete: (service: BeautyService) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });

  const style = {
    opacity: isDragging ? 0.55 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="overflow-hidden rounded-md border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      {service.imageUrls?.[0] ? (
        <div
          className="relative aspect-[16/9] cursor-pointer border-b border-border"
          onClick={() => onImageClick(service.imageUrls!, service.name)}
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
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="mt-0.5 flex h-6 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
              aria-label={`${service.name} 순서 변경`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold">{service.name}</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{service.code}</p>
            </div>
          </div>
          <VisibilityToggle
            service={service}
            loading={visibilityLoading}
            onToggle={onToggleVisibility}
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
          <ServiceActions service={service} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </article>
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

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
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

function parseGender(value: unknown): BeautyServiceTargetGender {
  const s = String(value ?? "").trim();
  if (s === "여성") return "WOMEN";
  if (s === "남성") return "MEN";
  return "ALL";
}
