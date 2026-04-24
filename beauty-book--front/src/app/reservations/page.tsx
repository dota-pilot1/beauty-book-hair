"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { useReservationsByDate, useChangeReservationStatus } from "@/entities/reservation/model/useReservations";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";
import { useBookingFlow } from "@/features/booking/model/bookingFlowStore";

const STATUS_META: Record<ReservationStatus, { label: string; className: string }> = {
  REQUESTED:            { label: "승인 대기",   className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  CONFIRMED:            { label: "예약 확정",   className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  CANCELLED_BY_CUSTOMER:{ label: "고객 취소",   className: "bg-muted text-muted-foreground" },
  CANCELLED_BY_ADMIN:   { label: "관리자 취소", className: "bg-muted text-muted-foreground" },
  COMPLETED:            { label: "완료",        className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  NO_SHOW:              { label: "노쇼",        className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

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
  const dateOptions = useMemo(() => getNextDateOptions(7), []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const { data: reservations = [], isLoading } = useReservationsByDate(selectedDate);
  const changeStatus = useChangeReservationStatus();

  return (
    <CustomerShell
      eyebrow="Reservations"
      title="예약 현황"
      description="날짜별 예약 현황을 확인합니다."
      showSidebarIntro={false}
      showHeader={false}
    >
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
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" />
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
                  onChangeStatus={(status) => changeStatus.mutate({ id: r.id, status })}
                  isPending={changeStatus.isPending}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </CustomerShell>
  );
}

function ReservationCard({
  reservation: r,
  onChangeStatus,
  isPending,
}: {
  reservation: Reservation;
  onChangeStatus: (status: string) => void;
  isPending: boolean;
}) {
  const meta = STATUS_META[r.status];

  return (
    <div className="rounded-2xl border border-black/10 bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {formatTime(r.startAt)} ~ {formatTime(r.endAt)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">{r.beautyServiceName}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {r.staffName} · {r.customerName}
          </p>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${meta.className}`}>
          {meta.label}
        </span>
      </div>

      {/* 관리자 액션 */}
      {r.status === "REQUESTED" && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onChangeStatus("CONFIRMED")}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            승인
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onChangeStatus("CANCELLED_BY_ADMIN")}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50"
          >
            거절
          </button>
        </div>
      )}
      {r.status === "CONFIRMED" && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onChangeStatus("COMPLETED")}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            완료 처리
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onChangeStatus("NO_SHOW")}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50"
          >
            노쇼
          </button>
        </div>
      )}
    </div>
  );
}
