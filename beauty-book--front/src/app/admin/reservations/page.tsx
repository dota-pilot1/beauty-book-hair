"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useReservationsByDate, useChangeReservationStatus } from "@/entities/reservation/model/useReservations";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";

const STATUS_META: Record<ReservationStatus, { label: string; className: string }> = {
  REQUESTED:            { label: "승인 대기",   className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  CONFIRMED:            { label: "예약 확정",   className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  CANCELLED_BY_CUSTOMER:{ label: "고객 취소",   className: "bg-muted text-muted-foreground" },
  CANCELLED_BY_ADMIN:   { label: "관리자 취소", className: "bg-muted text-muted-foreground" },
  COMPLETED:            { label: "완료",        className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  NO_SHOW:              { label: "노쇼",        className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
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

  const { data: reservations = [], isLoading } = useReservationsByDate(selectedDate);
  const changeStatus = useChangeReservationStatus();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header className="rounded-3xl border border-black/12 bg-gradient-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Reservations
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
              onClick={() => setSelectedDate(opt.value)}
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

        {/* 예약 목록 */}
        <section className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4" />
            {dateOptions.find((d) => d.value === selectedDate)?.shortLabel} 예약
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {reservations.length}건
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/50" />
              ))
            ) : reservations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-black/10 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                해당 날짜에 예약이 없습니다.
              </p>
            ) : (
              reservations.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onChangeStatus={(status, adminMemo) =>
                    changeStatus.mutate({ id: r.id, status, adminMemo })
                  }
                  isPending={changeStatus.isPending}
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
  onChangeStatus,
  isPending,
}: {
  reservation: Reservation;
  onChangeStatus: (status: string, adminMemo?: string) => void;
  isPending: boolean;
}) {
  const [cancelMemo, setCancelMemo] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);

  const handleAdminCancel = () => {
    onChangeStatus("CANCELLED_BY_ADMIN", cancelMemo || undefined);
    setShowCancelInput(false);
    setCancelMemo("");
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-background p-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {formatTime(r.startAt)} ~ {formatTime(r.endAt)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">{r.beautyServiceName}</h3>
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
                <button type="button" disabled={isPending} onClick={handleAdminCancel}
                  className="flex-1 rounded-lg bg-rose-500 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                  취소 확정
                </button>
                <button type="button" onClick={() => { setShowCancelInput(false); setCancelMemo(""); }}
                  className="flex-1 rounded-lg border border-black/10 py-1.5 text-xs font-medium text-muted-foreground">
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
