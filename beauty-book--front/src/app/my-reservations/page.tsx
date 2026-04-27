"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { useMyReservations, useChangeReservationStatus, useDeleteReservation } from "@/entities/reservation/model/useReservations";
import { useAuth } from "@/entities/user/model/authStore";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";

const STATUS_META: Record<ReservationStatus, { label: string; className: string }> = {
  REQUESTED:            { label: "승인 대기", className: "border border-black/30 bg-white text-foreground" },
  CONFIRMED:            { label: "예약 확정", className: "border border-black bg-black text-white" },
  CANCELLED_BY_CUSTOMER:{ label: "고객 취소", className: "border border-black/12 bg-black/[0.03] text-foreground/40" },
  CANCELLED_BY_ADMIN:   { label: "관리자취소", className: "border border-black/12 bg-black/[0.03] text-foreground/40" },
  COMPLETED:            { label: "완료",     className: "border border-black/12 bg-black/[0.03] text-foreground/40" },
  NO_SHOW:              { label: "노쇼",     className: "border border-rose-300 bg-rose-50 text-rose-600" },
};

type Tab = "REQUESTED" | "COMPLETED" | "OTHER";

const TABS: { key: Tab; label: string }[] = [
  { key: "REQUESTED", label: "승인 대기" },
  { key: "COMPLETED", label: "완료" },
  { key: "OTHER",     label: "그외" },
];

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric", day: "numeric", weekday: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export default function MyReservationsPage() {
  return (
    <RequireAuth>
      <MyReservationsContent />
    </RequireAuth>
  );
}

function MyReservationsContent() {
  const { data: reservations = [], isLoading } = useMyReservations();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("REQUESTED");
  const changeStatus = useChangeReservationStatus();
  const deleteReservation = useDeleteReservation();

  const counts: Record<Tab, number> = {
    REQUESTED: reservations.filter((r) => r.status === "REQUESTED").length,
    COMPLETED: reservations.filter((r) => r.status === "COMPLETED").length,
    OTHER:     reservations.filter((r) => !["REQUESTED", "COMPLETED"].includes(r.status)).length,
  };

  const list = reservations.filter((r) => {
    if (tab === "REQUESTED") return r.status === "REQUESTED";
    if (tab === "COMPLETED") return r.status === "COMPLETED";
    return !["REQUESTED", "COMPLETED"].includes(r.status);
  });

  const handleCancel = (r: Reservation) => {
    if (r.status === "REQUESTED") {
      deleteReservation.mutate(r.id, {
        onSuccess: () => toast.success("예약 요청이 취소되었습니다."),
        onError: () => toast.error("취소에 실패했습니다. 다시 시도해 주세요."),
      });
    } else {
      changeStatus.mutate(
        { id: r.id, status: "CANCELLED_BY_CUSTOMER" },
        {
          onSuccess: () => toast.success("예약이 취소되었습니다."),
          onError: () => toast.error("예약 취소에 실패했습니다. 다시 시도해 주세요."),
        }
      );
    }
  };

  return (
    <CustomerShell
      eyebrow="My Reservations"
      title="내 예약"
      description="승인 대기, 확정, 지난 예약을 확인합니다."
      showSidebarIntro={false}
      showHeader={false}
    >
      <div className="space-y-3">
        {/* 헤더 바 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/35">My Reservations</p>
            <h1 className="text-base font-semibold text-foreground leading-tight">
              {user?.username ?? "고객"}님의 예약
              <span className="ml-2 text-xs font-normal text-foreground/35">전체 {reservations.length}건</span>
            </h1>
          </div>
          <Link
            href="/booking"
            className="inline-flex h-8 items-center rounded-md bg-foreground px-3.5 text-xs font-semibold text-background hover:opacity-80 transition-opacity"
          >
            새 예약하기
          </Link>
        </div>

        {/* 탭 */}
        <div className="inline-flex rounded-lg border border-black/12 bg-black/[0.025] p-0.5">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
                  active
                    ? "bg-white text-foreground shadow-sm border border-black/10"
                    : "text-foreground/40 hover:text-foreground/70"
                }`}
              >
                {t.label}
                <span
                  className={`inline-flex min-w-[16px] items-center justify-center rounded px-1 text-[10px] font-bold leading-4 ${
                    active ? "bg-black text-white" : "bg-black/[0.07] text-foreground/50"
                  }`}
                >
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* 목록 */}
        <div className="rounded-xl border border-black/12 bg-white overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-black/[0.06]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-black/[0.07]" />
                  <div className="h-3 w-40 animate-pulse rounded bg-black/[0.05]" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-foreground/35">
                {tab === "REQUESTED" && "승인 대기 중인 예약이 없습니다."}
                {tab === "COMPLETED" && "완료된 예약이 없습니다."}
                {tab === "OTHER" && "취소 · 확정 · 노쇼 예약이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06]">
              {list.map((r) => (
                <ReservationRow
                  key={r.id}
                  reservation={r}
                  onCancel={["REQUESTED", "CONFIRMED"].includes(r.status) ? () => handleCancel(r) : undefined}
                  isPending={changeStatus.isPending || deleteReservation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}

function ReservationRow({
  reservation: r,
  onCancel,
  isPending,
}: {
  reservation: Reservation;
  onCancel?: () => void;
  isPending: boolean;
}) {
  const meta = STATUS_META[r.status];
  const items = r.items?.length
    ? r.items
    : [{ id: null, beautyServiceId: r.beautyServiceId, beautyServiceName: r.beautyServiceName, durationMinutes: 0, price: 0, displayOrder: 0 }];
  const main = items[0];
  const options = items.slice(1);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.015] transition-colors">
      {/* 시술명 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate text-sm font-semibold text-foreground">{main.beautyServiceName}</span>
          {options.length > 0 && (
            <span className="shrink-0 text-[11px] text-foreground/35">+{options.length}</span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-foreground/45 truncate">
          {r.staffName} &middot; {formatDateTime(r.startAt)}
        </p>
      </div>

      {/* 우측 액션 */}
      <div className="flex shrink-0 items-center gap-2">
        {onCancel && (
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="h-6 rounded border border-black/12 px-2 text-[11px] text-foreground/35 hover:border-black/25 hover:text-foreground/70 transition-colors disabled:opacity-30"
          >
            취소
          </button>
        )}
        <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${meta.className}`}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}
