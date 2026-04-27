"use client";

import Link from "next/link";
import { toast } from "sonner";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { useMyReservations, useChangeReservationStatus, useDeleteReservation } from "@/entities/reservation/model/useReservations";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";

const STATUS_META: Record<ReservationStatus, { label: string; className: string }> = {
  REQUESTED:            { label: "승인 대기",   className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  CONFIRMED:            { label: "예약 확정",   className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  CANCELLED_BY_CUSTOMER:{ label: "고객 취소",   className: "bg-muted text-muted-foreground" },
  CANCELLED_BY_ADMIN:   { label: "관리자 취소", className: "bg-muted text-muted-foreground" },
  COMPLETED:            { label: "완료",        className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  NO_SHOW:              { label: "노쇼",        className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long", day: "numeric", weekday: "short",
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
  const changeStatus = useChangeReservationStatus();
  const deleteReservation = useDeleteReservation();

  const active = reservations.filter((r) => ["REQUESTED", "CONFIRMED"].includes(r.status));
  const past = reservations.filter((r) => !["REQUESTED", "CONFIRMED"].includes(r.status));

  return (
    <CustomerShell
      eyebrow="My Reservations"
      title="내 예약"
      description="승인 대기, 확정, 지난 예약을 확인합니다."
      showSidebarIntro={false}
      showHeader={false}
      action={
        <Link
          href="/booking"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          새 예약하기
        </Link>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" />
          ))
        ) : reservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-muted/20 p-10 text-center">
            <p className="text-sm text-muted-foreground">예약 내역이 없습니다.</p>
            <Link
              href="/booking"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              예약하러 가기
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-foreground">진행 중인 예약</h2>
                <div className="space-y-3">
                  {active.map((r) => (
                    <MyReservationCard
                      key={r.id}
                      reservation={r}
                      onCancel={() => {
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
                      }}
                      isPending={changeStatus.isPending || deleteReservation.isPending}
                    />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">지난 예약</h2>
                <div className="space-y-3">
                  {past.map((r) => (
                    <MyReservationCard key={r.id} reservation={r} isPending={false} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </CustomerShell>
  );
}

function MyReservationCard({
  reservation: r,
  onCancel,
  isPending,
}: {
  reservation: Reservation;
  onCancel?: () => void;
  isPending: boolean;
}) {
  const meta = STATUS_META[r.status];

  const items = r.items?.length ? r.items : [{ id: null, beautyServiceId: r.beautyServiceId, beautyServiceName: r.beautyServiceName, durationMinutes: 0, price: 0, displayOrder: 0 }];
  const main = items[0];
  const options = items.slice(1);

  return (
    <div className="rounded-2xl border border-black/10 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {options.length > 0 && (
              <span className="inline-flex shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">메인</span>
            )}
            <h3 className="truncate text-base font-semibold text-foreground">{main.beautyServiceName}</h3>
          </div>
          {options.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              + 옵션 {options.map((o) => o.beautyServiceName).join(", ")}
            </p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {r.staffName} · {formatDateTime(r.startAt)}
          </p>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${meta.className}`}>
          {meta.label}
        </span>
      </div>
      {onCancel && ["REQUESTED", "CONFIRMED"].includes(r.status) && (
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="mt-3 rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          예약 취소
        </button>
      )}
    </div>
  );
}
