"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { Eye, Flame, Tag, Settings, Plus, X, Loader2, Check, Pencil, GripVertical } from "lucide-react";
import {
  useBlogCategories, useBlogPopularPosts,
  useCreateBlogCategory, useUpdateBlogCategory, useDeleteBlogCategory,
} from "@/entities/blog/model/useBlog";
import { useAuth } from "@/entities/user/model/authStore";
import type { BlogCategoryItem } from "@/entities/blog/model/types";

type Props = {
  selectedCategory?: string;
  onCategoryClick?: (slug: string | undefined) => void;
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "category";
}

/* ─── 드래그 가능한 카테고리 행 ─── */
function SortableRow({
  item,
  editingId,
  editName,
  onEditName,
  onStartEdit,
  onCommitEdit,
  onDelete,
  isPendingUpdate,
  isPendingDelete,
}: {
  item: BlogCategoryItem;
  editingId: number | null;
  editName: string;
  onEditName: (v: string) => void;
  onStartEdit: (item: BlogCategoryItem) => void;
  onCommitEdit: (item: BlogCategoryItem) => void;
  onDelete: (id: number) => void;
  isPendingUpdate: boolean;
  isPendingDelete: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 ${
        isDragging ? "border-primary/40 shadow-lg opacity-80 z-10" : "border-black/6"
      }`}
    >
      {/* 드래그 핸들 */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 flex h-6 w-6 cursor-grab active:cursor-grabbing items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* 이름 */}
      <div className="flex-1 min-w-0">
        {editingId === item.id ? (
          <input
            value={editName}
            onChange={(e) => onEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommitEdit(item);
              if (e.key === "Escape") onStartEdit({ ...item, name: "" });
            }}
            autoFocus
            className="h-8 w-full rounded-md border border-primary bg-background px-2.5 text-sm focus:outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{item.name}</span>
            {item.postCount > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">({item.postCount})</span>
            )}
          </div>
        )}
      </div>

      {/* 편집 확인 */}
      {editingId === item.id ? (
        <button
          onClick={() => onCommitEdit(item)}
          disabled={isPendingUpdate}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
        >
          {isPendingUpdate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
      ) : (
        <button
          onClick={() => onStartEdit(item)}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {/* 삭제 */}
      <button
        onClick={() => onDelete(item.id)}
        disabled={isPendingDelete}
        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── 카테고리 관리 다이얼로그 ─── */
function CategoryManageDialog({ categories }: { categories: BlogCategoryItem[] }) {
  const createCategory = useCreateBlogCategory();
  const updateCategory = useUpdateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BlogCategoryItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const openDialog = () => {
    setItems([...categories].sort((a, b) => a.displayOrder - b.displayOrder));
    setEditingId(null);
    setNewName("");
    setOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIdx = prev.findIndex((i) => i.id === active.id);
        const newIdx = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const startEdit = (item: BlogCategoryItem) => {
    if (!item.name) { setEditingId(null); return; }
    setEditingId(item.id);
    setEditName(item.name);
  };

  const commitEdit = (item: BlogCategoryItem) => {
    const name = editName.trim();
    if (!name || name === item.name) { setEditingId(null); return; }
    const idx = items.findIndex((i) => i.id === item.id);
    updateCategory.mutate(
      { id: item.id, body: { name, slug: toSlug(name), displayOrder: idx } },
      { onSuccess: (updated) => {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, name: updated.name, slug: updated.slug } : i));
        setEditingId(null);
      }}
    );
  };

  const handleDelete = (id: number) => {
    deleteCategory.mutate(id, { onSuccess: () => setItems((prev) => prev.filter((i) => i.id !== id)) });
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    createCategory.mutate(
      { name, slug: toSlug(name), displayOrder: items.length },
      { onSuccess: (created) => { setItems((prev) => [...prev, created]); setNewName(""); }}
    );
  };

  const handleSaveOrder = () => {
    items.forEach((item, idx) => {
      if (item.displayOrder !== idx) {
        updateCategory.mutate({ id: item.id, body: { name: item.name, slug: item.slug, displayOrder: idx } });
      }
    });
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (v) openDialog(); else setOpen(false); }}>
      <Dialog.Trigger asChild>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="카테고리 관리"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[480px] max-h-[85vh] rounded-2xl bg-background shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-150">

          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 shrink-0">
            <div>
              <Dialog.Title className="text-sm font-semibold">카테고리 관리</Dialog.Title>
              <p className="text-xs text-muted-foreground mt-0.5">드래그로 순서를 변경하세요</p>
            </div>
            <Dialog.Close className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* 목록 */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {items.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">카테고리가 없습니다.</p>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    editingId={editingId}
                    editName={editName}
                    onEditName={setEditName}
                    onStartEdit={startEdit}
                    onCommitEdit={commitEdit}
                    onDelete={handleDelete}
                    isPendingUpdate={updateCategory.isPending}
                    isPendingDelete={deleteCategory.isPending}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* 새 카테고리 추가 */}
          <div className="px-5 py-3 border-t border-black/8 shrink-0">
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="새 카테고리명 입력"
                className="h-9 flex-1 min-w-0 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleAdd}
                disabled={createCategory.isPending || !newName.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-black/8 shrink-0">
            <Dialog.Close className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm text-muted-foreground hover:bg-muted transition-colors">
              취소
            </Dialog.Close>
            <button
              onClick={handleSaveOrder}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              순서 저장
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ─── 메인 사이드바 ─── */
export function BlogAside({ selectedCategory, onCategoryClick }: Props) {
  const { data: categories = [] } = useBlogCategories();
  const { data: popularPosts = [] } = useBlogPopularPosts();
  const { user } = useAuth();

  const canManage = user?.role?.code === "ROLE_ADMIN" || user?.role?.code === "ROLE_MANAGER";

  return (
    <div className="space-y-4">
      {/* 카테고리 */}
      <div className="rounded-2xl border border-black/8 bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">카테고리</p>
          </div>
          {canManage && <CategoryManageDialog categories={categories} />}
        </div>

        <ul className="space-y-0.5">
          {onCategoryClick ? (
            <li>
              <button
                onClick={() => onCategoryClick(undefined)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  !selectedCategory ? "bg-primary text-primary-foreground font-semibold" : "text-foreground hover:bg-muted"
                }`}
              >
                전체 보기
              </button>
            </li>
          ) : (
            <li>
              <Link href="/blog" className="block w-full rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                전체 보기
              </Link>
            </li>
          )}

          {[...categories].sort((a, b) => a.displayOrder - b.displayOrder).map((cat) =>
            onCategoryClick ? (
              <li key={cat.slug}>
                <button
                  onClick={() => onCategoryClick(cat.slug)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    selectedCategory === cat.slug ? "bg-primary text-primary-foreground font-semibold" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.postCount > 0 && (
                    <span className={`text-xs tabular-nums ${selectedCategory === cat.slug ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {cat.postCount}
                    </span>
                  )}
                </button>
              </li>
            ) : (
              <li key={cat.slug}>
                <Link
                  href={`/blog?category=${cat.slug}`}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                    selectedCategory === cat.slug ? "bg-primary text-primary-foreground font-semibold" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.postCount > 0 && (
                    <span className={`text-xs tabular-nums ${selectedCategory === cat.slug ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {cat.postCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          )}

          {categories.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">카테고리 없음</li>
          )}
        </ul>
      </div>

      {/* 인기 포스트 */}
      {popularPosts.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">인기 포스트</p>
          </div>
          <ul className="space-y-3">
            {popularPosts.map((post, idx) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="flex items-start gap-3 group">
                  <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {post.viewCount}
                      <span className="text-muted-foreground/40">·</span>
                      <span>{post.authorName}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
