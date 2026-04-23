"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, GripVertical, Plus, Trash2 } from "lucide-react";
import { menuApi, type UpdateMenuBody } from "@/entities/menu/api/menuApi";
import type { MenuRecord, MenuItem } from "@/entities/menu/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { MenuFormDialog } from "./MenuFormDialog";

function buildTree(flat: MenuRecord[]): MenuItem[] {
  const map = new Map<number, MenuItem>();
  flat.forEach((m) => map.set(m.id, { ...m, children: [] }));
  const roots: MenuItem[] = [];
  map.forEach((item) => {
    if (item.parentId === null) roots.push(item);
    else map.get(item.parentId!)?.children.push(item);
  });
  const sort = (items: MenuItem[]) => {
    items.sort((a, b) => a.displayOrder - b.displayOrder);
    items.forEach((i) => sort(i.children));
  };
  sort(roots);
  return roots;
}

function toUpdateBody(m: MenuRecord): UpdateMenuBody {
  return {
    parentId: m.parentId,
    label: m.label,
    labelKey: m.labelKey,
    path: m.path,
    icon: m.icon,
    isExternal: m.isExternal,
    requiredRole: m.requiredRole,
    requiredPermission: m.requiredPermission,
    visible: m.visible,
    displayOrder: m.displayOrder,
  };
}

/* ── Detail Panel ─────────────────────────────── */
function DetailPanel({
  menu,
  allMenus,
  onSaved,
  onDeleted,
}: {
  menu: MenuRecord;
  allMenus: MenuRecord[];
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<UpdateMenuBody>(toUpdateBody(menu));

  const set = <K extends keyof UpdateMenuBody>(k: K, v: UpdateMenuBody[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => menuApi.update(menu.id, form),
    onSuccess: () => {
      toast.success("저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["menus"] });
      onSaved();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => menuApi.delete(menu.id),
    onSuccess: () => {
      toast.success("삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["menus"] });
      onDeleted();
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const handleDelete = () => {
    if (!confirm(`"${menu.label}" 메뉴를 삭제하시겠습니까?\n하위 메뉴가 있으면 삭제할 수 없습니다.`)) return;
    deleteMutation.mutate();
  };

  const roots = allMenus.filter(
    (m) => m.parentId === null && m.id !== menu.id
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-mono">{menu.code}</p>
          <h3 className="font-semibold text-base">{menu.label}</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-md border border-destructive/40 text-destructive px-3 py-1.5 text-sm font-medium hover:bg-destructive/10 disabled:opacity-60 flex items-center gap-1"
          >
            <Trash2 size={14} />
            삭제
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        <Field label="부모 메뉴">
          <select
            value={form.parentId ?? ""}
            onChange={(e) => set("parentId", e.target.value ? Number(e.target.value) : null)}
            className={inputCls}
          >
            <option value="">없음 (루트)</option>
            {roots.map((m) => (
              <option key={m.id} value={m.id}>{m.label} ({m.code})</option>
            ))}
          </select>
        </Field>

        <Field label="레이블">
          <input
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="i18n 키">
          <input
            value={form.labelKey ?? ""}
            onChange={(e) => set("labelKey", e.target.value || null)}
            placeholder="nav.dashboard"
            className={inputCls}
          />
        </Field>

        <Field label="경로 (URL)">
          <input
            value={form.path ?? ""}
            onChange={(e) => set("path", e.target.value || null)}
            placeholder="/dashboard"
            className={inputCls}
          />
        </Field>

        <Field label="아이콘">
          <input
            value={form.icon ?? ""}
            onChange={(e) => set("icon", e.target.value || null)}
            placeholder="LayoutDashboard"
            className={inputCls}
          />
        </Field>

        <Field label="필요 역할">
          <input
            value={form.requiredRole ?? ""}
            onChange={(e) => set("requiredRole", e.target.value || null)}
            placeholder="ROLE_ADMIN"
            className={inputCls}
          />
        </Field>

        <Field label="표시 순서">
          <input
            type="number"
            value={form.displayOrder}
            onChange={(e) => set("displayOrder", Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => set("visible", e.target.checked)}
              className="h-4 w-4"
            />
            표시
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isExternal}
              onChange={(e) => set("isExternal", e.target.checked)}
              className="h-4 w-4"
            />
            외부 링크
          </label>
        </div>
      </div>
    </div>
  );
}

/* ── Sortable Tree Item ───────────────────────── */
function TreeNode({
  item,
  depth,
  selected,
  openMap,
  onSelect,
  onToggle,
}: {
  item: MenuItem;
  depth: number;
  selected: number | null;
  openMap: Record<number, boolean>;
  onSelect: (m: MenuRecord) => void;
  onToggle: (id: number) => void;
}) {
  const isOpen = !!openMap[item.id];
  const hasChildren = item.children.length > 0;
  const isSelected = selected === item.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        whileHover={{ x: 1 }}
        onClick={() => {
          onSelect(item);
          if (hasChildren) onToggle(item.id);
        }}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer group text-sm transition-colors ${
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
        >
          <GripVertical size={14} />
        </div>

        {hasChildren ? (
          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight size={14} className="shrink-0 opacity-50" />
          </motion.div>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className="truncate flex-1">{item.label}</span>

        {item.requiredRole && (
          <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1 py-0.5 rounded font-mono shrink-0">
            {item.requiredRole.replace("ROLE_", "")}
          </span>
        )}

        <span className="text-[10px] text-muted-foreground/40 font-mono opacity-0 group-hover:opacity-100 shrink-0">
          {item.displayOrder}
        </span>
      </motion.div>

      <AnimatePresence initial={false}>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <SortableContext
              items={item.children.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {item.children.map((child) => (
                <TreeNode
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  selected={selected}
                  openMap={openMap}
                  onSelect={onSelect}
                  onToggle={onToggle}
                />
              ))}
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Component ───────────────────────────── */
export function MenuTreeTab() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<MenuRecord | null>(null);
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});
  const [localFlat, setLocalFlat] = useState<MenuRecord[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: serverMenus = [], isLoading } = useQuery({
    queryKey: ["menus"],
    queryFn: menuApi.getAll,
    onSuccess: (data: MenuRecord[]) => setLocalFlat(data),
  } as any);

  const flat: MenuRecord[] = localFlat ?? serverMenus;
  const tree = useMemo(() => buildTree(flat), [flat]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveMutation = useMutation({
    mutationFn: (items: MenuRecord[]) =>
      Promise.all(items.map((m) => menuApi.update(m.id, toUpdateBody(m)))),
    onSuccess: () => {
      toast.success("순서가 저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["menus"] });
    },
    onError: (e) => toastError(e, "순서 저장에 실패했습니다."),
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = Number(active.id);
      const overId = Number(over.id);
      const activeItem = flat.find((m) => m.id === activeId);
      if (!activeItem) return;

      const parentId = activeItem.parentId;
      const siblings = flat
        .filter((m) => m.parentId === parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const oldIdx = siblings.findIndex((m) => m.id === activeId);
      const newIdx = siblings.findIndex((m) => m.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(siblings, oldIdx, newIdx).map((m, i) => ({
        ...m,
        displayOrder: i,
      }));

      const updated = flat.map((m) => {
        const r = reordered.find((r) => r.id === m.id);
        return r ?? m;
      });

      setLocalFlat(updated);
      saveMutation.mutate(reordered);
    },
    [flat, saveMutation]
  );

  const toggleOpen = useCallback((id: number) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">로딩 중...</p>;

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Left: Tree */}
      <div className="w-72 shrink-0 rounded-lg border border-border bg-muted/20 flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground">
            메뉴 트리 <span className="ml-1 font-normal opacity-60">드래그로 순서 변경</span>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-md bg-primary text-primary-foreground px-2 py-1 text-xs font-medium hover:opacity-90 flex items-center gap-1"
          >
            <Plus size={12} />
            추가
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          >
            <SortableContext items={tree.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {tree.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  depth={0}
                  selected={selected?.id ?? null}
                  openMap={openMap}
                  onSelect={setSelected}
                  onToggle={toggleOpen}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        {saveMutation.isPending && (
          <div className="px-3 py-1.5 border-t border-border text-xs text-muted-foreground animate-pulse">
            순서 저장 중...
          </div>
        )}
      </div>

      {/* Right: Detail */}
      <div className="flex-1 rounded-lg border border-border bg-background p-4 overflow-hidden">
        {selected ? (
          <DetailPanel
            key={selected.id}
            menu={selected}
            allMenus={flat}
            onSaved={() => setSelected(null)}
            onDeleted={() => setSelected(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            왼쪽 메뉴를 클릭하면 상세 편집할 수 있습니다.
          </div>
        )}
      </div>

      {createOpen && (
        <MenuFormDialog
          target="new"
          menus={flat}
          onClose={() => setCreateOpen(false)}
        />
      )}
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
