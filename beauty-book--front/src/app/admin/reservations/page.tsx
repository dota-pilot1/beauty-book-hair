"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { useReservationsByDate, useChangeReservationStatus, useDeleteReservation } from "@/entities/reservation/model/useReservations";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";

const DELETABLE_STATUSES: ReservationStatus[] = [
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_ADMIN",
  "EXPIRED",
  "COMPLETED",
  "NO_SHOW",
];

const STATUS_META: Record<ReservationStatus, { label: string; badgeClass: string; headerClass: string }> = {
  REQUESTED:            { label: "승인 대기",   badgeClass: "bg-amber-100 text-amber-700",    headerClass: "bg-amber-50/60 border-b border-amber-200" },
  CONFIRMED:            { label: "예약 확정",   badgeClass: "bg-emerald-100 text-emerald-700", headerClass: "bg-emerald-50/60 border-b border-emerald-200" },
  CANCELLED_BY_CUSTOMER:{ label: "고객 취소",   badgeClass: "bg-slate-100 text-slate-500",    headerClass: "bg-slate-50/60 border-b border-slate-200" },
  CANCELLED_BY_ADMIN:   { label: "관리자 취소", badgeClass: "bg-slate-100 text-slate-500",    headerClass: "bg-slate-50/60 border-b border-slate-200" },
  EXPIRED:              { label: "요청 만료",   badgeClass: "bg-zinc-100 text-zinc-500",      headerClass: "bg-zinc-50/60 border-b border-zinc-200" },
  COMPLETED:            { label: "완료",        badgeClass: "bg-blue-100 text-blue-700",      headerClass: "bg-blue-50/60 border-b border-blue-200" },
  NO_SHOW:              { label: "노쇼",        badgeClass: "bg-rose-100 text-rose-700",      headerClass: "bg-rose-50/60 border-b border-rose-200" },
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

export default function AdminReservationsPage() {
  const dateOptions = useMemo(() => getNextDateOptions(7), []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const { data: reservations = [], isLoading } = useReservationsByDate(selectedDate);
  const changeStatus = useChangeReservationStatus();
  const deleteReservation = useDeleteReservation();

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setShowBulkConfirm(false);
  };

  const deletableReservations = reservations.filter((r) => DELETABLE_STATUSES.includes(r.status));
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

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <header className="rounded-md border border-black/12 bg-gradient-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">예약 현황</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          전체 예약 현황을 날짜별로 확인하고 승인·관리합니다.
        </p>
      </header>

      <div className="space-y-4">
        {/* 날짜 탭 */}
        <section className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {dateOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleDateChange(opt.value)}
              className={`rounded-md border px-2 py-2.5 text-center transition-colors ${
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

        {/* 예약 목록 */}
        <section className="rounded-md border border-black/12 bg-card shadow-sm">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-2 border-b border-black/8 px-5 py-4 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4" />
            {dateOptions.find((d) => d.value === selectedDate)?.shortLabel} 예약
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {reservations.length}건
            </span>

            {/* 전체 선택 (삭제 가능한 항목이 있을 때만) */}
            {deletableReservations.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                {allDeletableSelected ? "전체 선택 해제" : `전체 선택 (${deletableReservations.length}건)`}
              </button>
            )}
          </div>

          {/* 일괄 삭제 액션바 */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-5 py-3">
              <span className="text-sm font-medium text-red-700">
                {selectedIds.size}건 선택됨
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedIds(new Set()); setShowBulkConfirm(false); }}
                  className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                >
                  선택 취소
                </button>
                {!showBulkConfirm ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setShowBulkConfirm(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    선택 삭제
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5">
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

          <div className="space-y-3 p-5">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-md bg-muted/50" />
              ))
            ) : reservations.length === 0 ? (
              <p className="rounded-md border border-dashed border-black/10 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                해당 날짜에 예약이 없습니다.
              </p>
            ) : (
              reservations.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
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
        </section>
      </div>
    </div>
  );
}

function ReservationCard({
  reservation: r,
  isSelected,
  onToggleSelect,
  onChangeStatus,
  onDelete,
  isPending,
}: {
  reservation: Reservation;
  isSelected: boolean;
  onToggleSelect: () => void;
  onChangeStatus: (status: string, adminMemo?: string) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [cancelMemo, setCancelMemo] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isDeletable = DELETABLE_STATUSES.includes(r.status);
  const meta = STATUS_META[r.status];

  const handleAdminCancel = () => {
    onChangeStatus("CANCELLED_BY_ADMIN", cancelMemo || undefined);
    setShowCancelInput(false);
    setCancelMemo("");
  };

  return (
    <div
      className={`overflow-hidden rounded-md border transition-colors ${
        isSelected ? "border-red-300 ring-1 ring-red-200" : "border-black/10"
      } bg-background`}
    >
      {/* 카드 헤더 */}
      <div className={`flex items-center gap-3 px-4 py-2.5 ${meta.headerClass}`}>
        {/* 체크박스 */}
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

        {/* 상태 배지 */}
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}>
          {meta.label}
        </span>

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
                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" />
                삭제
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1">
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
          <h3 className="text-base font-semibold text-foreground">{r.beautyServiceName}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {r.staffName} · {r.customerName} ({r.customerPhone})
          </p>
          {r.adminMemo && (
            <p className="mt-1 text-xs text-muted-foreground">메모: {r.adminMemo}</p>
          )}
        </div>

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
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-default ${
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
                className="w-full resize-none rounded-md border border-black/10 bg-muted/30 px-3 py-2 text-xs outline-none focus:border-black/20"
              />
              <div className="flex gap-1.5">
                <button type="button" disabled={isPending} onClick={handleAdminCancel}
                  className="flex-1 rounded-md bg-rose-500 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                  취소 확정
                </button>
                <button type="button" onClick={() => { setShowCancelInput(false); setCancelMemo(""); }}
                  className="flex-1 rounded-md border border-black/10 py-1.5 text-xs font-medium text-muted-foreground">
                  돌아가기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
