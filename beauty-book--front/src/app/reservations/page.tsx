"use client";

import { useMemo, useState } from "react";
import { Trash2, CalendarDays } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { useReservationsByDate, useMyReservations, useChangeReservationStatus, useDeleteReservation, useAllDeletedReservations, usePendingReservations } from "@/entities/reservation/model/useReservations";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";
import { useStore } from "@tanstack/react-store";
import { authStore } from "@/entities/user/model/authStore";
import { AdminDesignerScheduleDialog } from "@/features/admin-designer-schedule";

const DELETABLE_STATUSES: ReservationStatus[] = [
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_ADMIN",
  "COMPLETED",
  "NO_SHOW",
];

const STATUS_META: Record<ReservationStatus, { label: string; badgeClass: string; headerClass: string; legacyClass: string; borderClass: string }> = {
  REQUESTED:            { label: "승인 대기",   badgeClass: "bg-amber-100 text-amber-700",     headerClass: "bg-amber-50/60 border-b border-amber-200",   legacyClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",   borderClass: "border-l-amber-400 bg-amber-50/40" },
  CONFIRMED:            { label: "예약 확정",   badgeClass: "bg-emerald-100 text-emerald-700", headerClass: "bg-emerald-50/60 border-b border-emerald-200", legacyClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", borderClass: "border-l-emerald-400 bg-emerald-50/40" },
  CANCELLED_BY_CUSTOMER:{ label: "고객 취소",   badgeClass: "bg-slate-100 text-slate-500",     headerClass: "bg-slate-50/60 border-b border-slate-200",   legacyClass: "bg-muted text-muted-foreground",                     borderClass: "border-l-slate-300 bg-slate-50/40" },
  CANCELLED_BY_ADMIN:   { label: "관리자 취소", badgeClass: "bg-slate-100 text-slate-500",     headerClass: "bg-slate-50/60 border-b border-slate-200",   legacyClass: "bg-muted text-muted-foreground",                     borderClass: "border-l-slate-300 bg-slate-50/40" },
  COMPLETED:            { label: "완료",        badgeClass: "bg-blue-100 text-blue-700",       headerClass: "bg-blue-50/60 border-b border-blue-200",     legacyClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",      borderClass: "border-l-blue-400 bg-blue-50/40" },
  NO_SHOW:              { label: "노쇼",        badgeClass: "bg-rose-100 text-rose-700",       headerClass: "bg-rose-50/60 border-b border-rose-200",     legacyClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",      borderClass: "border-l-rose-400 bg-rose-50/40" },
};

const ADMIN_STATUS_BUTTONS = [
  { status: "REQUESTED",          label: "승인 대기", className: "border-amber-300 bg-amber-50 text-amber-700" },
  { status: "CONFIRMED",          label: "예약 확정", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { status: "COMPLETED",          label: "완료",      className: "border-blue-300 bg-blue-50 text-blue-700" },
  { status: "NO_SHOW",            label: "노쇼",      className: "border-rose-300 bg-rose-50 text-rose-700" },
  { status: "CANCELLED_BY_ADMIN", label: "취소",      className: "border-black/15 bg-muted text-muted-foreground" },
] as const;

function getNextDateOptions(days: number) {
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const shortLabel = i === 0 ? "오늘" : i === 1 ? "내일" : new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(d);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    return { value, shortLabel, label };
  });
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export default function ReservationsPage() {
  return (
    <RequireAuth>
      <ReservationsContent />
    </RequireAuth>
  );
}

function ReservationsContent() {
  const user = useStore(authStore, (s) => s.user);
  const isAdmin = user?.role.code === "ROLE_ADMIN" || user?.role.code === "ROLE_MANAGER";

  const dateOptions = useMemo(() => getNextDateOptions(7), []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const [viewMode, setViewMode] = useState<"list" | "history">("list");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showPastDeleteConfirm, setShowPastDeleteConfirm] = useState(false);
  const [staffFilter, setStaffFilter] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const allQuery = useReservationsByDate(selectedDate);
  const myQuery = useMyReservations();
  const changeStatus = useChangeReservationStatus();
  const deleteReservation = useDeleteReservation();
  const allDeletedQuery = useAllDeletedReservations();
  const pendingQuery = usePendingReservations();

  const myIdSet = useMemo(
    () => new Set((Array.isArray(myQuery.data) ? myQuery.data : []).map((r) => r.id)),
    [myQuery.data]
  );

  const reservations = isAdmin
    ? (Array.isArray(allQuery.data) ? allQuery.data : [])
    : (Array.isArray(myQuery.data) ? myQuery.data : []).filter((r) => {
        const kst = new Date(r.startAt).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
        return kst === selectedDate;
      });
  const isLoading = isAdmin ? allQuery.isLoading : myQuery.isLoading;

  const staffList = useMemo(
    () => Array.from(new Set(reservations.map((r) => r.staffName))).sort(),
    [reservations]
  );
  const filteredReservations = staffFilter
    ? reservations.filter((r) => r.staffName === staffFilter)
    : reservations;

  const staffIdByName = useMemo(() => {
    const map = new Map<string, number>();
    reservations.forEach((r) => map.set(r.staffName, r.staffId));
    return map;
  }, [reservations]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
    setShowPastDeleteConfirm(false);
    setStaffFilter(null);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setShowBulkConfirm(false);
  };

  const isToday = selectedDate === dateOptions[0].value;
  const pastDeletable = isToday
    ? filteredReservations.filter((r) => new Date(r.endAt) < new Date())
    : [];

  const handlePastDelete = () => {
    pastDeletable.forEach((r) => deleteReservation.mutate(r.id));
    setShowPastDeleteConfirm(false);
  };

  const deletableReservations = filteredReservations.filter((r) => DELETABLE_STATUSES.includes(r.status));
  const allDeletableSelected =
    deletableReservations.length > 0 &&
    deletableReservations.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (allDeletableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableReservations.map((r) => r.id)));
    }
    setShowBulkConfirm(false);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteReservation.mutate(id));
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
  };

  const isPending = changeStatus.isPending || deleteReservation.isPending;

  const pendingList = Array.isArray(pendingQuery.data) ? pendingQuery.data : [];

  const innerContent = (
    <div className="space-y-4">
        {/* 승인 대기 섹션 (관리자 전용, 항상 노출) */}
        {isAdmin && (
          <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm">
            <div className="flex items-center gap-2 border-b border-amber-200/70 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-sm font-semibold text-amber-800">승인 대기</span>
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white">
                {pendingList.length}
              </span>
              <span className="ml-1 text-xs text-amber-600">시간이 지난 미처리 예약</span>
            </div>
            <div className="p-4">
              {pendingQuery.isLoading ? (
                <div className="h-16 animate-pulse rounded-xl bg-amber-100/60" />
              ) : pendingList.length === 0 ? (
                <p className="text-sm text-amber-700/60">시간이 지난 미처리 예약이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {pendingList.map((r) => (
                    <PastUnprocessedCard
                      key={r.id}
                      reservation={r}
                      onChangeStatus={(status) => changeStatus.mutate({ id: r.id, status })}
                      onDelete={() => deleteReservation.mutate(r.id)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 날짜 탭 */}
        <section className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {dateOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleDateChange(opt.value)}
              className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
                selectedDate === opt.value
                  ? "border-black/25 bg-primary text-primary-foreground"
                  : "border-black/10 bg-card hover:bg-accent"
              }`}
            >
              <span className="block text-xs font-medium">{opt.shortLabel}</span>
              <span className="mt-0.5 block text-[11px] opacity-70">{opt.label}</span>
            </button>
          ))}
        </section>

        {/* 예약 목록 섹션 */}
        <section className="overflow-hidden rounded-2xl border border-black/12 bg-card shadow-sm">
          {/* 섹션 헤더: 디자이너 필터 + 전체선택 + 뷰 토글 */}
          <div className="flex flex-wrap items-center gap-2 border-b border-black/8 px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStaffFilter(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  staffFilter === null
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                전체 <span className="ml-0.5 opacity-70">{reservations.length}</span>
              </button>
              {staffList.map((name) => {
                const count = reservations.filter((r) => r.staffName === name).length;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setStaffFilter(name)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      staffFilter === name
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {name} <span className="ml-0.5 opacity-70">{count}</span>
                  </button>
                );
              })}

              {isAdmin && staffFilter !== null && (
                <>
                  <span className="h-4 w-px bg-black/10" />
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15"
                  >
                    <CalendarDays className="h-3 w-3" />
                    스케쥴 보기
                  </button>
                </>
              )}

              {isAdmin && deletableReservations.length > 0 && viewMode === "list" && (
                <>
                  <span className="h-4 w-px bg-black/10" />
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {allDeletableSelected ? "전체 해제" : "전체 선택"}
                  </button>
                </>
              )}
              {isAdmin && pastDeletable.length > 0 && viewMode === "list" && (
                <>
                  <span className="h-4 w-px bg-black/10" />
                  {!showPastDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowPastDeleteConfirm(true)}
                      className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      지난 예약 {pastDeletable.length}건 삭제
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-2.5 py-1">
                      <span className="text-xs font-medium text-red-600">{pastDeletable.length}건 삭제할까요?</span>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handlePastDelete}
                        className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        확인
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPastDeleteConfirm(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        취소
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {isAdmin && (
              <div className="ml-auto inline-flex rounded-lg border border-black/10 bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  목록
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("history")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    viewMode === "history" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  삭제 이력
                </button>
              </div>
            )}
          </div>

          {/* 일괄 삭제 액션바 */}
          {isAdmin && selectedIds.size > 0 && (
            <div className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-5 py-3">
              <span className="text-sm font-medium text-red-700">{selectedIds.size}건 선택됨</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedIds(new Set()); setShowBulkConfirm(false); }}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                >
                  선택 취소
                </button>
                {!showBulkConfirm ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setShowBulkConfirm(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    선택 삭제
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5">
                    <span className="text-xs font-medium text-red-600">{selectedIds.size}건을 삭제할까요?</span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleBulkDelete}
                      className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
                    >
                      확인
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkConfirm(false)}
                      className="rounded-md border border-black/10 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-5">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" />
                ))}
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-3">
                {filteredReservations.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-black/10 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    해당 날짜에 예약이 없습니다.
                  </p>
                ) : (
                  filteredReservations.map((r) => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      isAdmin={isAdmin}
                      isMine={myIdSet.has(r.id)}
                      isSelected={selectedIds.has(r.id)}
                      onToggleSelect={() => toggleSelect(r.id)}
                      onChangeStatus={(status, adminMemo) =>
                        changeStatus.mutate({ id: r.id, status, adminMemo })
                      }
                      onDelete={() => deleteReservation.mutate(r.id)}
                      isPending={isPending}
                    />
                  ))
                )}
              </div>
            ) : (
              <HistoryView
                deletedData={Array.isArray(allDeletedQuery.data) ? allDeletedQuery.data : []}
                isLoading={allDeletedQuery.isLoading}
              />
            )}
          </div>
        </section>
      </div>
  );

  const scheduleDialog = isAdmin && staffFilter !== null && (
    <AdminDesignerScheduleDialog
      open={scheduleOpen}
      onClose={() => setScheduleOpen(false)}
      staffName={staffFilter}
      staffId={staffIdByName.get(staffFilter) ?? 0}
      initialDate={selectedDate}
    />
  );

  if (isAdmin) {
    return (
      <AdminShell eyebrow="ADMIN" title="예약 현황" description="날짜별 전체 예약을 조회하고 승인합니다.">
        {innerContent}
        {scheduleDialog}
      </AdminShell>
    );
  }
  return (
    <CustomerShell eyebrow="Reservations" title="예약 현황" description="내 예약 현황을 날짜별로 확인합니다." showSidebarIntro={false} showHeader={false}>
      {innerContent}
    </CustomerShell>
  );
}

function ReservationCard({
  reservation: r,
  isAdmin,
  isMine = false,
  isSelected,
  onToggleSelect,
  onChangeStatus,
  onDelete,
  isPending,
  forceDeletable = false,
}: {
  reservation: Reservation;
  isAdmin: boolean;
  isMine?: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onChangeStatus: (status: string, adminMemo?: string) => void;
  onDelete: () => void;
  isPending: boolean;
  forceDeletable?: boolean;
}) {
  const [cancelMemo, setCancelMemo] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isActive = ["REQUESTED", "CONFIRMED"].includes(r.status);
  const isDeletable = isAdmin && (forceDeletable || DELETABLE_STATUSES.includes(r.status));
  const meta = STATUS_META[r.status];

  const handleAdminCancel = () => {
    onChangeStatus("CANCELLED_BY_ADMIN", cancelMemo || undefined);
    setShowCancelInput(false);
    setCancelMemo("");
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors ${
        isSelected
          ? "border-red-300 ring-1 ring-red-200"
          : isMine
          ? "border-primary/40"
          : "border-black/10"
      } bg-background`}
    >
      {/* 카드 헤더: 상태 배지 + 시간 + 삭제 버튼 */}
      <div className={`flex items-center gap-3 px-4 py-2.5 ${meta.headerClass}`}>
        {/* 체크박스 (관리자 + 삭제가능 상태만) */}
        {isAdmin && (
          <button
            type="button"
            onClick={onToggleSelect}
            disabled={!isDeletable}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
              isDeletable
                ? isSelected
                  ? "border-red-400 bg-red-400 text-white"
                  : "border-black/20 bg-white hover:border-red-300"
                : "cursor-not-allowed border-black/10 bg-black/5"
            }`}
            aria-label="선택"
          >
            {isSelected && (
              <svg className="h-2.5 w-2.5" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        {/* 상태 배지 */}
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}>
          {meta.label}
        </span>

        {/* 내 예약 뱃지 */}
        {isMine && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            내 예약
          </span>
        )}

        {/* 시간 */}
        <span className="text-xs text-muted-foreground">
          {formatTime(r.startAt)} ~ {formatTime(r.endAt)}
        </span>

        {/* 삭제 버튼 (완료/노쇼/취소 상태만) */}
        {isDeletable && (
          <div className="ml-auto flex items-center gap-1.5">
            {!showDeleteConfirm ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" />
                삭제
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1">
                <span className="text-xs font-medium text-red-600">삭제할까요?</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => { onDelete(); setShowDeleteConfirm(false); }}
                  className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  확인
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-md border border-black/10 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 카드 바디 */}
      <div className="flex items-start gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          {(() => {
            const items = r.items?.length ? r.items : [{ id: null, beautyServiceId: r.beautyServiceId, beautyServiceName: r.beautyServiceName, durationMinutes: 0, price: 0, displayOrder: 0 }];
            const main = items[0];
            const options = items.slice(1);
            return (
              <>
                <div className="flex items-center gap-2">
                  {options.length > 0 && (
                    <span className="inline-flex shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">메인</span>
                  )}
                  <h3 className="truncate text-base font-semibold text-foreground">{main.beautyServiceName}</h3>
                </div>
                {options.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    + 옵션 {options.map((o) => o.beautyServiceName).join(", ")}
                  </p>
                )}
              </>
            );
          })()}
          <p className="mt-0.5 text-sm text-muted-foreground">
            {r.staffName}
            {isAdmin && r.customerName && ` · ${r.customerName} (${r.customerPhone ?? "-"})`}
          </p>
          {r.adminMemo && (
            <p className="mt-1 text-xs text-muted-foreground">메모: {r.adminMemo}</p>
          )}
        </div>

        {/* 관리자: 상태 버튼 그룹 */}
        {isAdmin && (
          <div className="shrink-0">
            {!showCancelInput ? (
              <div className="flex flex-col gap-1">
                {ADMIN_STATUS_BUTTONS.map(({ status, label, className }) => {
                  const isCurrent = r.status === status;
                  const isCancelBtn = status === "CANCELLED_BY_ADMIN";
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={isPending || isCurrent}
                      onClick={() => isCancelBtn ? setShowCancelInput(true) : onChangeStatus(status)}
                      className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-default ${
                        isCurrent
                          ? className
                          : "border-black/10 bg-background text-muted-foreground hover:bg-accent disabled:opacity-40"
                      }`}
                    >
                      {isCurrent ? `✓ ${label}` : label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="w-48 space-y-2">
                <p className="text-xs font-medium text-rose-600">취소 사유 (선택)</p>
                <textarea
                  value={cancelMemo}
                  onChange={(e) => setCancelMemo(e.target.value)}
                  placeholder="취소 사유를 입력하세요..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-black/10 bg-muted/30 px-3 py-2 text-xs outline-none focus:border-black/20"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleAdminCancel}
                    className="flex-1 rounded-lg bg-rose-500 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    취소 확정
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCancelInput(false); setCancelMemo(""); }}
                    className="flex-1 rounded-lg border border-black/10 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    돌아가기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 고객: 상태 뱃지만 */}
        {!isAdmin && (
          <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${meta.legacyClass}`}>
            {meta.label}
          </span>
        )}
      </div>

      {/* 고객 취소 버튼 */}
      {!isAdmin && isActive && (
        <div className="border-t border-black/5 px-4 pb-3 pt-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onChangeStatus("CANCELLED_BY_CUSTOMER")}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-50"
          >
            예약 취소
          </button>
        </div>
      )}
    </div>
  );
}


function HistoryView({
  deletedData,
  isLoading,
}: {
  deletedData: Reservation[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
    );
  }
  if (deletedData.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/10 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        삭제된 예약이 없습니다.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {deletedData.map((r) => {
        const meta = STATUS_META[r.status];
        const items = r.items?.length ? r.items : null;
        const mainName = items ? items[0].beautyServiceName : r.beautyServiceName;
        const optionCount = items ? Math.max(items.length - 1, 0) : 0;
        return (
          <div key={r.id} className="overflow-hidden rounded-2xl border border-black/10 bg-background opacity-70">
            <div className={`flex items-center gap-3 px-4 py-2 ${meta.headerClass}`}>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}>
                {meta.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(r.startAt)} ~ {formatTime(r.endAt)}
              </span>
              {r.deletedAt && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  삭제: {new Intl.DateTimeFormat("ko-KR", {
                    month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                    timeZone: "Asia/Seoul",
                  }).format(new Date(r.deletedAt))}
                </span>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {mainName}
                {optionCount > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">+옵션 {optionCount}</span>
                )}
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">디자이너</p>
                  <p className="mt-0.5 font-medium text-foreground">{r.staffName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">고객</p>
                  <p className="mt-0.5 font-medium text-foreground">
                    {r.customerName ?? "—"}{r.customerPhone ? ` (${r.customerPhone})` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PastUnprocessedCard({
  reservation: r,
  onChangeStatus,
  onDelete,
  isPending,
}: {
  reservation: Reservation;
  onChangeStatus: (status: string) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const meta = STATUS_META[r.status];
  const items = r.items?.length ? r.items : [{ beautyServiceName: r.beautyServiceName, displayOrder: 0 }];
  const main = items[0];
  const options = items.slice(1);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-white px-4 py-3">
      {/* 시간 + 시술 정보 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}>
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(r.startAt)} ~ {formatTime(r.endAt)}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {main.beautyServiceName}
          {options.length > 0 && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              +옵션 {options.map((o) => o.beautyServiceName).join(", ")}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {r.staffName}{r.customerName ? ` · ${r.customerName} (${r.customerPhone ?? "-"})` : ""}
        </p>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={isPending || r.status === "COMPLETED"}
          onClick={() => onChangeStatus("COMPLETED")}
          className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-default disabled:opacity-40"
        >
          완료
        </button>
        <button
          type="button"
          disabled={isPending || r.status === "NO_SHOW"}
          onClick={() => onChangeStatus("NO_SHOW")}
          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-default disabled:opacity-40"
        >
          노쇼
        </button>
        {!showDeleteConfirm ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1">
            <span className="text-xs text-red-600">삭제?</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => { onDelete(); setShowDeleteConfirm(false); }}
              className="rounded bg-red-500 px-1.5 py-0.5 text-xs font-medium text-white disabled:opacity-50"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs text-muted-foreground"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
