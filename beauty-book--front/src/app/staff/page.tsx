"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, X, UserCircle2 } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { api } from "@/shared/api/axios";

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
  const [roleFilter, setRoleFilter] = useState<StaffRole | "ALL">("ALL");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);

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

  const filtered = roleFilter === "ALL" ? staffList : staffList.filter((s) => s.role === roleFilter);

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

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/20 px-4 py-4">
      <header className="mx-auto mb-3 flex w-full max-w-[1600px] items-center justify-between rounded-md border border-border bg-background px-4 py-3 shadow-sm">
        <div>
          <p className="text-[11px] font-bold uppercase text-primary">BeautyBook</p>
          <h1 className="text-lg font-semibold">직원 관리</h1>
        </div>
        <p className="hidden text-sm text-muted-foreground md:block">
          디자이너, 스탭, 데스크 직원을 관리합니다.
        </p>
      </header>

      <section className="mx-auto grid w-full max-w-[1600px] items-start gap-3 lg:grid-cols-2">
        {/* 왼쪽: 테이블 */}
        <div className="rounded-md border border-border bg-background p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              {(["ALL", "DESIGNER", "STAFF", "DESK"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    roleFilter === role
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {role === "ALL" ? "전체" : ROLE_LABELS[role]}
                  <span className="ml-1 text-xs">
                    ({role === "ALL" ? staffList.length : staffList.filter((s) => s.role === role).length})
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={openCreate}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              + 직원 등록
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">순서</th>
                  <th className="pb-2 pr-4 font-medium">이름</th>
                  <th className="pb-2 pr-4 font-medium">직무</th>
                  <th className="pb-2 pr-4 font-medium">소개</th>
                  <th className="pb-2 pr-4 font-medium">활성</th>
                  <th className="pb-2 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      등록된 직원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((staff) => (
                    <tr
                      key={staff.id}
                      onClick={() => setSelectedStaff(staff)}
                      className={`cursor-pointer border-b border-border/50 last:border-0 transition-colors hover:bg-muted/40 ${
                        selectedStaff?.id === staff.id ? "bg-muted/60" : ""
                      }`}
                    >
                      <td className="py-3 pr-4 text-muted-foreground">{staff.displayOrder}</td>
                      <td className="py-3 pr-4 font-medium">{staff.name}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASS[staff.role]}`}>
                          {ROLE_LABELS[staff.role]}
                        </span>
                      </td>
                      <td className="max-w-[240px] truncate py-3 pr-4 text-muted-foreground">
                        {staff.introduction ?? "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <Switch.Root
                          checked={staff.active}
                          disabled
                          className="relative inline-flex h-5 w-9 cursor-not-allowed items-center rounded-full bg-muted data-[state=checked]:bg-primary"
                        >
                          <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4" />
                        </Switch.Root>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(staff); }}
                          className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 오른쪽: 상세 패널 */}
        {selectedStaff ? (
          <StaffDetailPanel
            staff={selectedStaff}
            onEdit={() => openEdit(selectedStaff)}
            onClose={() => setSelectedStaff(null)}
          />
        ) : (
          <div className="flex items-center justify-center rounded-md border border-dashed border-border bg-background p-8 text-sm text-muted-foreground shadow-sm">
            직원을 선택하면 상세 정보가 표시됩니다.
          </div>
        )}
      </section>

      {/* 등록/수정 다이얼로그 */}
      <Dialog.Root open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold">
                {editTarget ? "직원 수정" : "직원 등록"}
              </Dialog.Title>
              <Dialog.Close className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">이름 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예) 하린"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid gap-1.5">
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

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">소개</label>
                <input
                  value={form.introduction}
                  onChange={(e) => setForm({ ...form, introduction: e.target.value })}
                  placeholder="짧은 소개 문구"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">프로필 이미지 URL</label>
                <input
                  value={form.profileImageUrl}
                  onChange={(e) => setForm({ ...form, profileImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">노출 순서</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">활성 여부</label>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch.Root
                      checked={form.active}
                      onCheckedChange={(v) => setForm({ ...form, active: v })}
                      className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted data-[state=checked]:bg-primary"
                    >
                      <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4" />
                    </Switch.Root>
                    <span className="text-sm text-muted-foreground">{form.active ? "ON" : "OFF"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={closeDialog} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.name.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? "저장 중..." : editTarget ? "수정" : "등록"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {staff.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={staff.profileImageUrl} alt={staff.name} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <UserCircle2 className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-semibold">{staff.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
          <Switch.Root
            checked={staff.active}
            disabled
            className="relative inline-flex h-5 w-9 cursor-not-allowed items-center rounded-full bg-muted data-[state=checked]:bg-primary"
          >
            <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4" />
          </Switch.Root>
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
                <Switch.Root
                  checked={svc.active}
                  onCheckedChange={() => toggleService(svc.beautyServiceId, svc.active)}
                  disabled={replaceServicesMutation.isPending}
                  className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-muted data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4" />
                </Switch.Root>
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
