"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { useAuth } from "@/entities/user/model/authStore";
import {
  useReservationsByDate,
  useChangeReservationStatus,
} from "@/entities/reservation/model/useReservations";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";
import { useMemo, useState } from "react";

const STATUS_META: Record<ReservationStatus, { label: string; className: string }> = {
  REQUESTED:             { label: "승인 대기",   className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  CONFIRMED:             { label: "예약 확정",   className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  CANCELLED_BY_CUSTOMER: { label: "고객 취소",   className: "bg-muted text-muted-foreground" },
  CANCELLED_BY_ADMIN:    { label: "관리자 취소", className: "bg-muted text-muted-foreground" },
  COMPLETED:             { label: "완료",        className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  NO_SHOW:               { label: "노쇼",        className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

function todayKST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const today = useMemo(() => todayKST(), []);

  const { data: todayReservations = [], isLoading } = useReservationsByDate(today);
  const changeStatus = useChangeReservationStatus();

  const requested = todayReservations.filter((r) => r.status === "REQUESTED").length;
  const confirmed = todayReservations.filter((r) => r.status === "CONFIRMED").length;

  return (
    <AdminShell
      eyebrow="Admin Dashboard"
      title={`${user?.username ?? "운영자"}님, 오늘 운영 현황입니다.`}
      description="오늘 예약 현황을 확인하고 승인·완료·노쇼를 처리합니다."
      action={
        <Link
          href="/reservations"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          전체 예약 보기
        </Link>
      }
    >
      <div className="space-y-4">
        {/* 통계 */}
        <section className="grid gap-3 md:grid-cols-4">
          {[
            { label: "오늘 전체 예약", value: isLoading ? "…" : String(todayReservations.length) },
            { label: "승인 대기",      value: isLoading ? "…" : String(requested) },
            { label: "예약 확정",      value: isLoading ? "…" : String(confirmed) },
            { label: "근무 직원",      value: "—" },
          ].map((item) => (
            <article key={item.label} className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
            </article>
          ))}
        </section>

        {/* 오늘 예약 현황 */}
        <section className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4" />
            오늘 예약 현황
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {todayReservations.length}건
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/50" />
              ))
            ) : todayReservations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-black/10 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                오늘 예약이 없습니다.
              </p>
            ) : (
              todayReservations.map((r) => (
                <DashboardReservationCard
                  key={r.id}
                  reservation={r}
                  onChangeStatus={(status, adminMemo) => changeStatus.mutate({ id: r.id, status, adminMemo })}
                  isPending={changeStatus.isPending}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

const ADMIN_STATUS_BUTTONS = [
  { status: "REQUESTED",          label: "승인 대기", className: "border-amber-300 bg-amber-50 text-amber-700" },
  { status: "CONFIRMED",          label: "예약 확정", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { status: "COMPLETED",          label: "완료",      className: "border-blue-300 bg-blue-50 text-blue-700" },
  { status: "NO_SHOW",            label: "노쇼",      className: "border-rose-300 bg-rose-50 text-rose-700" },
  { status: "CANCELLED_BY_ADMIN", label: "취소",      className: "border-black/15 bg-muted text-muted-foreground" },
] as const;

function DashboardReservationCard({
  reservation: r,
  onChangeStatus,
  isPending,
}: {
  reservation: Reservation;
  onChangeStatus: (status: string, adminMemo?: string) => void;
  isPending: boolean;
}) {
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelMemo, setCancelMemo] = useState("");

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
            <div className="w-44 space-y-2">
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
      </div>
    </div>
  );
}
