"use client";

import { useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { useDeletedReservationsByDate } from "@/entities/reservation/model/useReservations";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";

const STATUS_META: Record<ReservationStatus, { label: string }> = {
  REQUESTED:             { label: "승인 대기" },
  CONFIRMED:             { label: "예약 확정" },
  CANCELLED_BY_CUSTOMER: { label: "고객 취소" },
  CANCELLED_BY_ADMIN:    { label: "관리자 취소" },
  EXPIRED:               { label: "요청 만료" },
  COMPLETED:             { label: "완료" },
  NO_SHOW:               { label: "노쇼" },
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

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export default function DeletedReservationsPage() {
  const dateOptions = useMemo(() => getNextDateOptions(7), []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);

  const { data: deletedReservations = [], isLoading } = useDeletedReservationsByDate(selectedDate);

  return (
    <div className="space-y-6">
      <header className="rounded-md border border-black/12 bg-gradient-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Deleted Reservations
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">예약 현황 (삭제)</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          삭제된 예약 이력을 날짜별로 확인합니다. 삭제된 예약은 복구할 수 없습니다.
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

        <section className="rounded-md border border-black/12 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarX2 className="h-4 w-4 text-muted-foreground" />
            {dateOptions.find((d) => d.value === selectedDate)?.shortLabel} 삭제된 예약
            <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {deletedReservations.length}건
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-md bg-muted/50" />
              ))
            ) : deletedReservations.length === 0 ? (
              <p className="rounded-md border border-dashed border-black/10 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                해당 날짜에 삭제된 예약이 없습니다.
              </p>
            ) : (
              deletedReservations.map((r) => (
                <DeletedReservationCard key={r.id} reservation={r} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function DeletedReservationCard({ reservation: r }: { reservation: Reservation }) {
  return (
    <div className="rounded-md border border-black/8 bg-muted/20 p-4 opacity-70">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground line-through">
          {STATUS_META[r.status].label}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTime(r.startAt)} ~ {formatTime(r.endAt)}
        </span>
        {r.deletedAt && (
          <span className="ml-auto text-xs text-muted-foreground">
            삭제: {formatDateTime(r.deletedAt)}
          </span>
        )}
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-muted-foreground line-through">{r.beautyServiceName}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {r.staffName} · {r.customerName} ({r.customerPhone})
        </p>
        {r.adminMemo && (
          <p className="mt-1 text-xs text-muted-foreground">메모: {r.adminMemo}</p>
        )}
      </div>
    </div>
  );
}
