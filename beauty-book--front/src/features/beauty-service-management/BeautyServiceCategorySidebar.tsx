"use client";

import { useEffect, useState } from "react";
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
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { beautyServiceCategoryApi } from "@/entities/beauty-service-category/api/beautyServiceCategoryApi";
import type { BeautyServiceCategory } from "@/entities/beauty-service/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { BeautyServiceCategoryFormDialog } from "./BeautyServiceCategoryFormDialog";

type Props = {
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
};

export function BeautyServiceCategorySidebar({ selectedCategoryId, onSelectCategory }: Props) {
  const qc = useQueryClient();
  const [formTarget, setFormTarget] = useState<BeautyServiceCategory | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<BeautyServiceCategory | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ["beauty-service-categories"],
    queryFn: () => beautyServiceCategoryApi.list(),
  });

  useEffect(() => {
    if (selectedCategoryId !== null) return;
    if (categories.length > 0) {
      onSelectCategory(categories[0].id);
    }
  }, [categories, onSelectCategory, selectedCategoryId]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => beautyServiceCategoryApi.delete(id),
    onSuccess: () => {
      toast.success("카테고리가 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["beauty-service-categories"] });
      qc.invalidateQueries({ queryKey: ["beauty-services"] });
      if (selectedCategoryId === deleteTarget?.id) {
        onSelectCategory(null);
      }
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const reorderMutation = useMutation({
    mutationFn: (nextCategories: BeautyServiceCategory[]) =>
      Promise.all(
        nextCategories.map((category, index) =>
          beautyServiceCategoryApi.update(category.id, {
            name: category.name,
            description: category.description ?? undefined,
            visible: category.visible,
            displayOrder: index,
          })
        )
      ),
    onMutate: async (nextCategories) => {
      await qc.cancelQueries({ queryKey: ["beauty-service-categories"] });
      const previous = qc.getQueryData<BeautyServiceCategory[]>(["beauty-service-categories"]);
      qc.setQueryData(
        ["beauty-service-categories"],
        nextCategories.map((category, index) => ({ ...category, displayOrder: index }))
      );
      return { previous };
    },
    onError: (e, _nextCategories, context) => {
      if (context?.previous) {
        qc.setQueryData(["beauty-service-categories"], context.previous);
      }
      toastError(e, "순서 변경에 실패했습니다.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beauty-service-categories"] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((category) => category.id === active.id);
    const newIndex = categories.findIndex((category) => category.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    reorderMutation.mutate(arrayMove(categories, oldIndex, newIndex));
  };

  return (
    <>
      <aside className="rounded-md border border-border bg-background shadow-sm">
        <div className="p-3">
          <button
            type="button"
            onClick={() => setFormTarget("new")}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/20 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            카테고리 추가
          </button>
        </div>

        <div className="px-3 pb-3">
          {isLoading ? (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-6 text-center text-xs font-medium text-muted-foreground">
              데이터를 가져오는 중...
            </p>
          ) : null}
          {isError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-6 text-center text-xs text-destructive">
              카테고리를 불러오지 못했습니다.
            </p>
          ) : null}
          {!isLoading && !isError && categories.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
              등록된 카테고리가 없습니다.
            </p>
          ) : null}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map((category) => category.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {categories.map((category) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    active={selectedCategoryId === category.id}
                    onSelect={() => onSelectCategory(category.id)}
                    onEdit={() => setFormTarget(category)}
                    onDelete={() => setDeleteTarget(category)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </aside>

      <BeautyServiceCategoryFormDialog
        open={formTarget !== null}
        category={formTarget === "new" ? null : formTarget}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 카테고리를 삭제하시겠습니까?`}
        description="이 카테고리를 사용하는 시술이 있으면 삭제할 수 없습니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function SortableCategoryItem({
  category,
  active,
  onSelect,
  onEdit,
  onDelete,
}: {
  category: BeautyServiceCategory;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  const style = {
    opacity: isDragging ? 0.55 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex h-14 items-center gap-2 overflow-hidden rounded-md border transition-all ${
        active
          ? "translate-x-0.5 border-primary/30 bg-primary/10 text-primary shadow-sm"
          : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {active ? (
        <div className="absolute left-0 top-[15%] h-[70%] w-1 rounded-r-full bg-primary" />
      ) : null}

      <div className="flex shrink-0 items-center pl-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`flex h-12 w-8 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing ${
            active ? "text-primary" : "text-muted-foreground"
          }`}
          aria-label={`${category.name} 순서 변경`}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 flex-col justify-center py-2 text-left"
      >
        <span className={`block truncate text-sm ${active ? "font-bold" : "font-medium"}`}>{category.name}</span>
        <span className="block truncate font-mono text-[10px] opacity-70">{category.code}</span>
      </button>

      <div className="flex shrink-0 items-center gap-2 pr-2">
        <span
          className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
            active ? "bg-primary text-primary-foreground" : "border border-border bg-muted text-muted-foreground"
          }`}
        >
          {category.visible ? "ON" : "OFF"}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-background shadow-sm hover:bg-accent"
            aria-label={`${category.name} 수정`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-destructive/40 bg-background text-destructive shadow-sm hover:bg-destructive/10"
            aria-label={`${category.name} 삭제`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
