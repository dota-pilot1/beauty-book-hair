"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import * as Dialog from "@radix-ui/react-dialog";
import { ToggleSwitch } from "@/shared/ui/ToggleSwitch";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, X, UserCircle2, CalendarClock, CalendarDays, LayoutList, LayoutGrid, Camera, GripVertical } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { api } from "@/shared/api/axios";
import { uploadImage } from "@/shared/api/upload";
import { AdminDesignerScheduleDialog } from "@/features/admin-designer-schedule";

type StaffRole = "DESIGNER" | "STAFF" | "DESK";

type StaffMember = {
  id: number;
  name: string;
  role: StaffRole;
  profileImageUrl: string | null;
  introduction: string | null;
  active: boolean;
  displayOrder: number;
  createdAt: string;
};

type StaffServiceItem = {
  id: number;
  staffId: number;
  beautyServiceId: number;
  beautyServiceName: string;
  active: boolean;
};

type StaffForm = {
  name: string;
  role: StaffRole;
  profileImageUrl: string;
  introduction: string;
  active: boolean;
  displayOrder: number;
};

type SortableHandleProps = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

const ROLE_LABELS: Record<StaffRole, string> = {
  DESIGNER: "디자이너",
  STAFF: "스탭",
  DESK: "데스크",
};

const ROLE_BADGE_CLASS: Record<StaffRole, string> = {
  DESIGNER: "bg-primary/10 text-primary",
  STAFF: "bg-muted text-muted-foreground",
  DESK: "border border-border text-muted-foreground",
};

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

type WorkingHour = {
  id: number;
  staffId: number;
  dayOfWeek: DayOfWeek;
  startTime: string | null;
  endTime: string | null;
  working: boolean;
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "월",
  TUESDAY: "화",
  WEDNESDAY: "수",
  THURSDAY: "목",
  FRIDAY: "금",
  SATURDAY: "토",
  SUNDAY: "일",
};

const ALL_DAYS: DayOfWeek[] = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

const staffApi = {
  listAll: () => api.get<StaffMember[]>("/api/admin/staff").then((r) => r.data),
  create: (data: StaffForm) => api.post<StaffMember>("/api/admin/staff", data).then((r) => r.data),
  update: (id: number, data: StaffForm) =>
    api.patch<StaffMember>(`/api/admin/staff/${id}`, data).then((r) => r.data),
  listServices: (staffId: number) =>
    api.get<StaffServiceItem[]>(`/api/admin/staff/${staffId}/services`).then((r) => r.data),
  replaceServices: (staffId: number, beautyServiceIds: number[]) =>
    api
      .put<StaffServiceItem[]>(`/api/admin/staff/${staffId}/services`, { beautyServiceIds })
      .then((r) => r.data),
  listWorkingHours: (staffId: number) =>
    api.get<WorkingHour[]>(`/api/admin/schedules/staff/${staffId}/working-hours`).then((r) => r.data),
  replaceWorkingHours: (staffId: number, workingHours: { dayOfWeek: DayOfWeek; startTime: string | null; endTime: string | null; working: boolean }[]) =>
    api.put<WorkingHour[]>(`/api/admin/schedules/staff/${staffId}/working-hours`, { workingHours }).then((r) => r.data),
};

const EMPTY_FORM: StaffForm = {
  name: "",
  role: "DESIGNER",
  profileImageUrl: "",
  introduction: "",
  active: true,
  displayOrder: 0,
};

export default function StaffPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <StaffAdminPage />
    </RequireRole>
  );
}

function StaffAdminPage() {
  const qc = useQueryClient();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [roleFilter, setRoleFilter] = useState<StaffRole | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [scheduleTarget, setScheduleTarget] = useState<StaffMember | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<StaffMember | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: staffList = [] } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: staffApi.listAll,
  });

  const createMutation = useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-staff"] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StaffForm }) => staffApi.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      setSelectedStaff(updated);
      closeDialog();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (nextStaffList: StaffMember[]) => {
      const updates = nextStaffList
        .map((staff, index) => ({ staff, displayOrder: index }))
        .filter(({ staff, displayOrder }) => staff.displayOrder !== displayOrder);

      await Promise.all(
        updates.map(({ staff, displayOrder }) =>
          staffApi.update(staff.id, {
            name: staff.name,
            role: staff.role,
            profileImageUrl: staff.profileImageUrl ?? "",
            introduction: staff.introduction ?? "",
            active: staff.active,
            displayOrder,
          })
        )
      );
    },
    onMutate: async (nextStaffList) => {
      await qc.cancelQueries({ queryKey: ["admin-staff"] });
      const previous = qc.getQueryData<StaffMember[]>(["admin-staff"]);
      qc.setQueryData<StaffMember[]>(
        ["admin-staff"],
        nextStaffList.map((staff, index) => ({ ...staff, displayOrder: index }))
      );
      return { previous };
    },
    onError: (_error, _nextStaffList, context) => {
      if (context?.previous) qc.setQueryData(["admin-staff"], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin-staff"] }),
  });

  const filtered = roleFilter === "ALL" ? staffList : staffList.filter((s) => s.role === roleFilter);
  const sortableIds = filtered.map((staff) => staff.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || reorderMutation.isPending) return;

    const oldIndex = filtered.findIndex((staff) => staff.id === active.id);
    const newIndex = filtered.findIndex((staff) => staff.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedFiltered = arrayMove(filtered, oldIndex, newIndex);
    const reorderedIds = new Set(reorderedFiltered.map((staff) => staff.id));
    let filteredCursor = 0;
    const reorderedFull =
      roleFilter === "ALL"
        ? reorderedFiltered
        : staffList.map((staff) => {
            if (!reorderedIds.has(staff.id)) return staff;
            const nextStaff = reorderedFiltered[filteredCursor];
            filteredCursor += 1;
            return nextStaff ?? staff;
          });

    reorderMutation.mutate(reorderedFull);
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(staff: StaffMember) {
    setEditTarget(staff);
    setForm({
      name: staff.name,
      role: staff.role,
      profileImageUrl: staff.profileImageUrl ?? "",
      introduction: staff.introduction ?? "",
      active: staff.active,
      displayOrder: staff.displayOrder,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit() {
    const payload: StaffForm = { ...form, displayOrder: Number(form.displayOrder) };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleFormImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("파일 크기는 5MB 이하여야 합니다."); return; }
    try {
      setImageUploading(true);
      const url = await uploadImage(file, "staff");
      setForm((prev) => ({ ...prev, profileImageUrl: url }));
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  return (
    <AdminShell
      eyebrow="Admin"
      title="직원 관리"
      description="디자이너, 스탭, 데스크 직원을 관리합니다."
    >
      <section className="rounded-md border border-black/8 bg-card shadow-sm">
        <div className="p-4">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(["ALL", "DESIGNER", "STAFF", "DESK"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    roleFilter === role
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {role === "ALL" ? "전체" : ROLE_LABELS[role]}
                  <span className="ml-1 text-xs">
                    ({role === "ALL" ? staffList.length : staffList.filter((s) => s.role === role).length})
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 items-stretch overflow-hidden rounded-md border border-border bg-background">
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center px-3 transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  title="목록 뷰"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <div className="w-px bg-border" />
                <button
                  onClick={() => setViewMode("card")}
                  className={`flex items-center px-3 transition-colors ${viewMode === "card" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  title="카드 뷰"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={openCreate}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                + 직원 등록
              </button>
            </div>
          </div>

          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/80 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="w-14 pb-3 pr-4 font-semibold">정렬</th>
                      <th className="pb-3 pr-4 font-semibold">직원</th>
                      <th className="pb-3 pr-4 font-semibold">직무</th>
                      <th className="pb-3 pr-4 font-semibold">소개</th>
                      <th className="pb-3 pr-4 font-semibold">상태</th>
                      <th className="pb-3 font-semibold">관리</th>
                    </tr>
                  </thead>
                  <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            등록된 직원이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((staff) => (
                          <SortableStaffRow
                            key={staff.id}
                            staff={staff}
                            selected={selectedStaff?.id === staff.id}
                            disabled={reorderMutation.isPending}
                            onDetail={(s) => { setSelectedStaff(s); setDetailOpen(true); }}
                            onEdit={openEdit}
                            onSchedule={(s) => { setScheduleTarget(s); setScheduleOpen(true); }}
                            onCalendar={(s) => { setCalendarTarget(s); setCalendarOpen(true); }}
                          />
                        ))
                      )}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {filtered.length === 0 ? (
                    <p className="col-span-full py-8 text-center text-sm text-muted-foreground">등록된 직원이 없습니다.</p>
                  ) : (
                    filtered.map((staff) => (
                      <SortableStaffCard
                        key={staff.id}
                        staff={staff}
                        disabled={reorderMutation.isPending}
                        onEdit={openEdit}
                        onSchedule={(s) => { setScheduleTarget(s); setScheduleOpen(true); }}
                        onCalendar={(s) => { setCalendarTarget(s); setCalendarOpen(true); }}
                        onDetail={(s) => { setSelectedStaff(s); setDetailOpen(true); }}
                        onImageUpdated={() => qc.invalidateQueries({ queryKey: ["admin-staff"] })}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </section>

      {/* 상세 다이얼로그 */}
      <Dialog.Root open={detailOpen} onOpenChange={(open) => { if (!open) { setDetailOpen(false); setSelectedStaff(null); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-background p-6 shadow-lg">
            <Dialog.Title className="sr-only">직원 상세 정보</Dialog.Title>
            {selectedStaff && (
              <StaffDetailPanel
                staff={selectedStaff}
                onEdit={() => { setDetailOpen(false); openEdit(selectedStaff); }}
                onClose={() => { setDetailOpen(false); setSelectedStaff(null); }}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 스케쥴 다이얼로그 */}
      <Dialog.Root open={scheduleOpen} onOpenChange={(open) => { if (!open) { setScheduleOpen(false); setScheduleTarget(null); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="sr-only">근무 시간 설정</Dialog.Title>
            {scheduleTarget && (
              <StaffScheduleModal
                staff={scheduleTarget}
                onClose={() => { setScheduleOpen(false); setScheduleTarget(null); }}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 직원별 예약 스케쥴 다이얼로그 */}
      {calendarTarget && (
        <AdminDesignerScheduleDialog
          open={calendarOpen}
          onClose={() => { setCalendarOpen(false); setCalendarTarget(null); }}
          staffName={calendarTarget.name}
          staffId={calendarTarget.id}
          initialDate={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })}
        />
      )}

      {/* 등록/수정 다이얼로그 */}
      <Dialog.Root open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-md border border-border bg-background shadow-lg">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
              <Dialog.Title className="text-base font-semibold">
                {editTarget ? "직원 수정" : "직원 등록"}
              </Dialog.Title>
              <Dialog.Close className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_560px]">
              <div className="grid gap-4 p-6">
                <div className="grid gap-2 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
                  <label className="text-sm font-medium">이름 *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예) 하린"
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
                  <label className="text-sm font-medium">직무 *</label>
                  <Select.Root
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as StaffRole })}
                  >
                    <Select.Trigger className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                      <Select.Value />
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="z-50 rounded-md border border-border bg-background shadow-md">
                        <Select.Viewport className="p-1">
                          {(["DESIGNER", "STAFF", "DESK"] as StaffRole[]).map((r) => (
                            <Select.Item
                              key={r}
                              value={r}
                              className="cursor-pointer rounded px-3 py-1.5 text-sm outline-none hover:bg-muted focus:bg-muted"
                            >
                              <Select.ItemText>{ROLE_LABELS[r]}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                <div className="grid gap-2 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
                  <label className="text-sm font-medium">소개</label>
                  <input
                    value={form.introduction}
                    onChange={(e) => setForm({ ...form, introduction: e.target.value })}
                    placeholder="짧은 소개 문구"
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-start">
                  <label className="pt-2 text-sm font-medium">프로필 이미지</label>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border">
                      {form.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.profileImageUrl} alt="preview" className="h-16 w-16 object-cover" />
                      ) : (
                        <UserCircle2 className="h-9 w-9 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFormImageUpload}
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={imageUploading}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {imageUploading ? "업로드 중..." : "이미지 선택"}
                      </button>
                      {form.profileImageUrl && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, profileImageUrl: "" }))}
                          className="text-xs text-muted-foreground hover:text-destructive text-left"
                        >
                          이미지 제거
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
                    <label className="text-sm font-medium">노출 순서</label>
                    <input
                      type="number"
                      value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-center">
                    <label className="text-sm font-medium">활성 여부</label>
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        checked={form.active}
                        onCheckedChange={(v) => setForm({ ...form, active: v })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <StaffServiceAssignmentPanel staff={editTarget} />
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4">
              <button onClick={closeDialog} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || imageUploading || !form.name.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? "저장 중..." : editTarget ? "수정" : "등록"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AdminShell>
  );
}

function StaffServiceAssignmentPanel({ staff }: { staff: StaffMember | null }) {
  const qc = useQueryClient();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["admin-staff-services", staff?.id],
    queryFn: () => staffApi.listServices(staff!.id),
    enabled: staff != null,
  });

  const replaceServicesMutation = useMutation({
    mutationFn: (ids: number[]) => staffApi.replaceServices(staff!.id, ids),
    onSuccess: () => {
      if (staff) qc.invalidateQueries({ queryKey: ["admin-staff-services", staff.id] });
    },
  });

  function toggleService(beautyServiceId: number, currentActive: boolean) {
    const next = services.map((service) =>
      service.beautyServiceId === beautyServiceId
        ? { ...service, active: !currentActive }
        : service
    );
    replaceServicesMutation.mutate(next.filter((service) => service.active).map((service) => service.beautyServiceId));
  }

  return (
    <aside className="border-t border-border bg-muted/25 p-6 lg:border-l lg:border-t-0">
      <div className="mb-4">
        <p className="text-base font-semibold text-foreground">시술 가능 정보</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          오른쪽에서 직원이 담당 가능한 시술을 바로 켜고 끌 수 있습니다.
        </p>
      </div>

      {!staff ? (
        <div className="rounded-md border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
          직원 등록 후 수정 화면에서 가능한 시술을 연결할 수 있습니다.
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-md bg-background" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-md border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
          연결 가능한 시술 항목이 없습니다. 먼저 시술/가격 화면에서 시술을 등록해주세요.
        </div>
      ) : (
        <div className="grid max-h-[52vh] grid-cols-1 gap-2 overflow-y-auto pr-1 xl:grid-cols-2">
          {services.map((service) => (
            <label
              key={service.beautyServiceId}
              className="flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5 transition-colors hover:bg-accent"
            >
              <span className="min-w-0">
                <span className={`block truncate text-sm font-medium ${service.active ? "text-foreground" : "text-muted-foreground"}`}>
                  {service.beautyServiceName}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {service.active ? "예약 선택 가능" : "예약 선택 제외"}
                </span>
              </span>
              <ToggleSwitch
                checked={service.active}
                onCheckedChange={() => toggleService(service.beautyServiceId, service.active)}
                disabled={replaceServicesMutation.isPending}
              />
            </label>
          ))}
        </div>
      )}
    </aside>
  );
}

function SortableStaffRow({
  staff,
  selected,
  disabled,
  onDetail,
  onEdit,
  onSchedule,
  onCalendar,
}: {
  staff: StaffMember;
  selected: boolean;
  disabled: boolean;
  onDetail: (s: StaffMember) => void;
  onEdit: (s: StaffMember) => void;
  onSchedule: (s: StaffMember) => void;
  onCalendar: (s: StaffMember) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: staff.id, disabled });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={() => onDetail(staff)}
      className={`group cursor-pointer border-b border-border/40 bg-card last:border-0 transition-colors hover:bg-muted/35 ${
        selected ? "bg-muted/50" : ""
      } ${isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      <td className="py-3.5 pr-4 text-muted-foreground">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-accent hover:text-foreground active:cursor-grabbing"
          aria-label={`${staff.name} 순서 변경`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted ring-1 ring-border/60">
            {staff.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={staff.profileImageUrl} alt={staff.name} className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{staff.name}</p>
            <p className="text-xs text-muted-foreground">드래그로 노출 순서 변경</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 pr-4">
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASS[staff.role]}`}>
          {ROLE_LABELS[staff.role]}
        </span>
      </td>
      <td className="max-w-[360px] truncate py-3.5 pr-4 text-muted-foreground">
        {staff.introduction ?? "-"}
      </td>
      <td className="py-3.5 pr-4">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
          staff.active ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-md ${staff.active ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
          {staff.active ? "활성" : "비활성"}
        </span>
      </td>
      <td className="py-3.5">
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(staff); }}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          >
            수정
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSchedule(staff); }}
            className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <CalendarClock className="h-3 w-3" />
            근무시간
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCalendar(staff); }}
            className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <CalendarDays className="h-3 w-3" />
            스케쥴
          </button>
        </div>
      </td>
    </tr>
  );
}

function SortableStaffCard({
  staff,
  disabled,
  onEdit,
  onSchedule,
  onCalendar,
  onDetail,
  onImageUpdated,
}: {
  staff: StaffMember;
  disabled: boolean;
  onEdit: (s: StaffMember) => void;
  onSchedule: (s: StaffMember) => void;
  onCalendar: (s: StaffMember) => void;
  onDetail: (s: StaffMember) => void;
  onImageUpdated: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: staff.id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "relative z-10 opacity-90 shadow-md" : ""}
    >
      <StaffCard
        staff={staff}
        dragHandleProps={{ attributes, listeners }}
        onEdit={onEdit}
        onSchedule={onSchedule}
        onCalendar={onCalendar}
        onDetail={onDetail}
        onImageUpdated={onImageUpdated}
      />
    </div>
  );
}

function StaffDetailPanel({
  staff,
  onEdit,
  onClose,
}: {
  staff: StaffMember;
  onEdit: () => void;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["admin-staff-services", staff.id],
    queryFn: () => staffApi.listServices(staff.id),
  });

  const replaceServicesMutation = useMutation({
    mutationFn: (ids: number[]) => staffApi.replaceServices(staff.id, ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-staff-services", staff.id] }),
  });

  function toggleService(beautyServiceId: number, currentActive: boolean) {
    const next = services.map((s) =>
      s.beautyServiceId === beautyServiceId ? { ...s, active: !currentActive } : s
    );
    const activeIds = next.filter((s) => s.active).map((s) => s.beautyServiceId);
    replaceServicesMutation.mutate(activeIds);
  }

  return (
    <div className="rounded-md border border-border bg-background p-5 shadow-sm">
      {/* 헤더 */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
            {staff.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={staff.profileImageUrl} alt={staff.name} className="h-12 w-12 rounded-md object-cover" />
            ) : (
              <UserCircle2 className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-semibold">{staff.name}</p>
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              staff.role === "DESIGNER" ? "bg-primary/10 text-primary" :
              staff.role === "STAFF" ? "bg-muted text-muted-foreground" :
              "border border-border text-muted-foreground"
            }`}>
              {ROLE_LABELS[staff.role]}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">
            수정
          </button>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-muted-foreground">활성</span>
          <ToggleSwitch
            checked={staff.active}
            onCheckedChange={() => {}}
            disabled
          />
        </div>
        {staff.introduction && (
          <div className="flex gap-2">
            <span className="w-14 shrink-0 text-muted-foreground">소개</span>
            <span className="text-foreground">{staff.introduction}</span>
          </div>
        )}
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-muted-foreground">순서</span>
          <span>{staff.displayOrder}</span>
        </div>
      </div>

      {/* 가능 시술 */}
      <div>
        <p className="mb-2 text-sm font-medium">가능 시술</p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-muted-foreground">매핑된 시술이 없습니다.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-x-4 gap-y-2">
            {services.map((svc) => (
              <li key={svc.beautyServiceId} className="flex items-center gap-2">
                <ToggleSwitch
                  checked={svc.active}
                  onCheckedChange={() => toggleService(svc.beautyServiceId, svc.active)}
                  disabled={replaceServicesMutation.isPending}
                />
                <span className={`text-sm ${svc.active ? "text-foreground" : "text-muted-foreground line-through"}`}>
                  {svc.beautyServiceName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type WorkingHourRow = {
  dayOfWeek: DayOfWeek;
  working: boolean;
  startTime: string;
  endTime: string;
};

function StaffScheduleModal({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: workingHours = [], isLoading } = useQuery({
    queryKey: ["admin-staff-working-hours", staff.id],
    queryFn: () => staffApi.listWorkingHours(staff.id),
  });

  const [rows, setRows] = useState<WorkingHourRow[] | null>(null);

  const effectiveRows: WorkingHourRow[] = rows ?? (
    workingHours.length > 0
      ? ALL_DAYS.map((day) => {
          const found = workingHours.find((wh) => wh.dayOfWeek === day);
          return {
            dayOfWeek: day,
            working: found?.working ?? false,
            startTime: found?.startTime ?? "10:00",
            endTime: found?.endTime ?? "20:00",
          };
        })
      : ALL_DAYS.map((day) => ({ dayOfWeek: day, working: false, startTime: "10:00", endTime: "20:00" }))
  );

  function updateRow(day: DayOfWeek, patch: Partial<WorkingHourRow>) {
    setRows(effectiveRows.map((r) => r.dayOfWeek === day ? { ...r, ...patch } : r));
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      staffApi.replaceWorkingHours(
        staff.id,
        effectiveRows.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          working: r.working,
          startTime: r.working ? r.startTime : null,
          endTime: r.working ? r.endTime : null,
        }))
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-staff-working-hours", staff.id] });
      onClose();
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold">{staff.name} 근무 시간 설정</p>
          <p className="text-xs text-muted-foreground">요일별 근무 여부와 시간을 설정합니다.</p>
        </div>
        <button onClick={onClose} className="rounded p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-muted/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {effectiveRows.map((row) => (
            <div key={row.dayOfWeek} className="rounded-md border border-border/50 px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-sm font-medium text-muted-foreground">
                  {DAY_LABELS[row.dayOfWeek]}
                </span>
                <ToggleSwitch
                  checked={row.working}
                  onCheckedChange={(v) => updateRow(row.dayOfWeek, { working: v })}
                />
                {row.working ? (
                  <>
                    {/* 프리셋 칩 */}
                    {[
                      { label: "전일", start: "10:00", end: "20:00" },
                      { label: "오전반차", start: "14:00", end: "20:00" },
                      { label: "오후반차", start: "10:00", end: "14:00" },
                    ].map((preset) => {
                      const active = row.startTime === preset.start && row.endTime === preset.end;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => updateRow(row.dayOfWeek, { startTime: preset.start, endTime: preset.end })}
                          className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">휴무</span>
                )}
              </div>
              {row.working && (
                <div className="mt-2 flex items-center gap-2 pl-8">
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(e) => updateRow(row.dayOfWeek, { startTime: e.target.value })}
                    className="rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">~</span>
                  <input
                    type="time"
                    value={row.endTime}
                    onChange={(e) => updateRow(row.dayOfWeek, { endTime: e.target.value })}
                    className="rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          취소
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || isLoading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saveMutation.isPending ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function StaffCard({
  staff,
  dragHandleProps,
  onEdit,
  onSchedule,
  onCalendar,
  onDetail,
  onImageUpdated,
}: {
  staff: StaffMember;
  dragHandleProps?: SortableHandleProps;
  onEdit: (s: StaffMember) => void;
  onSchedule: (s: StaffMember) => void;
  onCalendar: (s: StaffMember) => void;
  onDetail: (s: StaffMember) => void;
  onImageUpdated: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("파일 크기는 5MB 이하여야 합니다."); return; }
    try {
      setUploading(true);
      const url = await uploadImage(file, "staff");
      const currentForm: StaffForm = {
        name: staff.name,
        role: staff.role,
        profileImageUrl: url,
        introduction: staff.introduction ?? "",
        active: staff.active,
        displayOrder: staff.displayOrder,
      };
      await staffApi.update(staff.id, currentForm);
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      onImageUpdated();
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* 이미지 영역 */}
      <div className="relative group h-40 bg-muted flex items-center justify-center">
        {staff.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={staff.profileImageUrl} alt={staff.name} className="h-full w-full object-cover" />
        ) : (
          <UserCircle2 className="h-16 w-16 text-muted-foreground/40" />
        )}
        {/* 업로드 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white disabled:opacity-60"
          >
            <Camera className="h-3.5 w-3.5" />
            {uploading ? "업로드 중..." : "이미지 변경"}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        {dragHandleProps ? (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="absolute left-2 top-2 z-10 inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-white/70 bg-white/90 text-muted-foreground shadow-sm hover:bg-white active:cursor-grabbing"
            aria-label={`${staff.name} 순서 변경`}
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
        {/* 활성 표시 */}
        <div className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-md border-2 border-card ${staff.active ? "bg-green-500" : "bg-muted-foreground/50"}`} title={staff.active ? "활성" : "비활성"} />
      </div>

      {/* 정보 영역 */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-semibold text-sm">{staff.name}</p>
            <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASS[staff.role]}`}>
              {ROLE_LABELS[staff.role]}
            </span>
          </div>
          {staff.introduction && (
            <p className="text-xs text-muted-foreground line-clamp-2">{staff.introduction}</p>
          )}
        </div>

        <div className="flex gap-1 mt-auto pt-1 border-t border-border/50">
          <button
            onClick={() => onDetail(staff)}
            className="flex-1 rounded border border-border py-1 text-xs hover:bg-muted"
          >
            상세
          </button>
          <button
            onClick={() => onEdit(staff)}
            className="flex-1 rounded border border-border py-1 text-xs hover:bg-muted"
          >
            수정
          </button>
          <button
            onClick={() => onSchedule(staff)}
            className="flex items-center gap-0.5 rounded border border-border px-2 py-1 text-xs hover:bg-muted"
            title="근무시간"
          >
            <CalendarClock className="h-3 w-3" />
          </button>
          <button
            onClick={() => onCalendar(staff)}
            className="flex items-center gap-0.5 rounded border border-border px-2 py-1 text-xs hover:bg-muted"
            title="스케쥴"
          >
            <CalendarDays className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
