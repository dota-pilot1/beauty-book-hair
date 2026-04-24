"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { useReservationsByDate, useMyReservations, useChangeReservationStatus } from "@/entities/reservation/model/useReservations";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";
import { useStore } from "@tanstack/react-store";
import { authStore } from "@/entities/user/model/authStore";

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
  const user = useStore(authStore, (s) => s.user);
  const isAdmin = user?.role.code === "ROLE_ADMIN" || user?.role.code === "ROLE_MANAGER";

  const dateOptions = useMemo(() => getNextDateOptions(7), []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);

  const allQuery = useReservationsByDate(selectedDate);
  const myQuery = useMyReservations();
  const changeStatus = useChangeReservationStatus();

  const reservations = isAdmin ? (allQuery.data ?? []) : (myQuery.data ?? []).filter((r) => {
    const kst = new Date(r.startAt).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    return kst === selectedDate;
  });
  const isLoading = isAdmin ? allQuery.isLoading : myQuery.isLoading;

  return (
    <CustomerShell
      eyebrow="Reservations"
      title="예약 현황"
      description={isAdmin ? "전체 예약 현황을 날짜별로 확인하고 승인·관리합니다." : "내 예약 현황을 날짜별로 확인합니다."}
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
                  isAdmin={isAdmin}
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
  isAdmin,
  onChangeStatus,
  isPending,
}: {
  reservation: Reservation;
  isAdmin: boolean;
  onChangeStatus: (status: string) => void;
  isPending: boolean;
}) {
  const meta = STATUS_META[r.status];
  const isActive = ["REQUESTED", "CONFIRMED"].includes(r.status);

  return (
    <div className="rounded-2xl border border-black/10 bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {formatTime(r.startAt)} ~ {formatTime(r.endAt)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">{r.beautyServiceName}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {r.staffName}
            {isAdmin && ` · ${r.customerName} (${r.customerPhone})`}
          </p>
        </div>

        {/* 관리자: 승인 토글 / 그 외: 상태 뱃지 */}
        {isAdmin && r.status === "REQUESTED" ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-xs text-muted-foreground">승인</span>
            <Switch.Root
              checked={false}
              disabled={isPending}
              onCheckedChange={(checked) => {
                if (checked) onChangeStatus("CONFIRMED");
              }}
              className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full bg-muted transition-colors data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5" />
            </Switch.Root>
          </div>
        ) : isAdmin && r.status === "CONFIRMED" ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-xs text-muted-foreground">승인</span>
            <Switch.Root
              checked={true}
              disabled={isPending}
              onCheckedChange={(checked) => {
                if (!checked) onChangeStatus("CANCELLED_BY_ADMIN");
              }}
              className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full bg-muted transition-colors data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5" />
            </Switch.Root>
          </div>
        ) : (
          <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${meta.className}`}>
            {meta.label}
          </span>
        )}
      </div>

      {/* 관리자 추가 액션 (완료/노쇼) */}
      {isAdmin && r.status === "CONFIRMED" && (
        <div className="mt-3 flex gap-2 border-t border-black/5 pt-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onChangeStatus("COMPLETED")}
            className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-50"
          >
            완료 처리
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onChangeStatus("NO_SHOW")}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-50"
          >
            노쇼
          </button>
        </div>
      )}

      {/* 고객 취소 */}
      {!isAdmin && isActive && (
        <div className="mt-3 border-t border-black/5 pt-3">
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
