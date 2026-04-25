"use client";

import Link from "next/link";
import { CalendarDays, Clock, CheckCircle2, Users, TrendingUp, Trash2 } from "lucide-react";
import { useAuth } from "@/entities/user/model/authStore";
import {
  useReservationsByDate,
  useChangeReservationStatus,
  useDeleteReservation,
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

const ADMIN_STATUS_BUTTONS = [
  { status: "REQUESTED",          label: "승인 대기", className: "border-amber-300 bg-amber-50 text-amber-700" },
  { status: "CONFIRMED",          label: "예약 확정", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { status: "COMPLETED",          label: "완료",      className: "border-blue-300 bg-blue-50 text-blue-700" },
  { status: "NO_SHOW",            label: "노쇼",      className: "border-rose-300 bg-rose-50 text-rose-700" },
  { status: "CANCELLED_BY_ADMIN", label: "취소",      className: "border-black/15 bg-muted text-muted-foreground" },
] as const;

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

function todayKST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const today = useMemo(() => todayKST(), []);

  const { data: todayReservations = [], isLoading } = useReservationsByDate(today);
  const changeStatus = useChangeReservationStatus();
  const deleteReservation = useDeleteReservation();

  const requested = todayReservations.filter((r) => r.status === "REQUESTED").length;
  const confirmed = todayReservations.filter((r) => r.status === "CONFIRMED").length;

  const stats = [
    { label: "오늘 전체 예약", value: isLoading ? "…" : String(todayReservations.length), icon: CalendarDays, accent: "text-foreground" },
    { label: "승인 대기",      value: isLoading ? "…" : String(requested),                 icon: Clock,        accent: "text-amber-600" },
    { label: "예약 확정",      value: isLoading ? "…" : String(confirmed),                 icon: CheckCircle2, accent: "text-emerald-600" },
    { label: "근무 직원",      value: "—",                                                  icon: Users,        accent: "text-foreground" },
  ];

  return (
    <div className="space-y-8 px-1 py-2">
      {/* 헤더 */}
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Admin Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {user?.username ?? "운영자"}님, 오늘 운영 현황입니다.
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            오늘 예약 현황을 확인하고 승인·완료·노쇼를 처리합니다.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/reservations"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            예약 홈
          </Link>
          <Link
            href="/admin/reservations"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            <TrendingUp className="h-4 w-4" />
            전체 예약 보기
          </Link>
        </div>
      </header>

      {/* 통계 카드 */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          오늘의 요약
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, accent }) => (
            <article
              key={label}
              className="flex items-start gap-4 rounded-2xl border border-black/8 bg-card p-5 shadow-sm"
            >
              <div className="rounded-xl bg-muted/60 p-2.5">
                <Icon className={`h-4 w-4 ${accent}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`mt-1 text-2xl font-semibold tracking-tight ${accent}`}>{value}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 오늘 예약 현황 */}
      <section className="rounded-2xl border border-black/8 bg-card shadow-sm">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between border-b border-black/6 px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">오늘 예약 현황</span>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {todayReservations.length}건
          </span>
        </div>

        {/* 예약 목록 */}
        <div className="p-6">
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/50" />
              ))
            ) : todayReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-muted/20 py-12">
                <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">오늘 예약이 없습니다.</p>
              </div>
            ) : (
              todayReservations.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onChangeStatus={(status, adminMemo) =>
                    changeStatus.mutate({ id: r.id, status, adminMemo })
                  }
                  onDelete={() => deleteReservation.mutate(r.id)}
                  isPending={changeStatus.isPending || deleteReservation.isPending}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const DELETABLE_STATUSES: ReservationStatus[] = [
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_ADMIN",
  "COMPLETED",
  "NO_SHOW",
];

function ReservationCard({
  reservation: r,
  onChangeStatus,
  onDelete,
  isPending,
}: {
  reservation: Reservation;
  onChangeStatus: (status: string, adminMemo?: string) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelMemo, setCancelMemo] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isDeletable = DELETABLE_STATUSES.includes(r.status);

  const handleAdminCancel = () => {
    onChangeStatus("CANCELLED_BY_ADMIN", cancelMemo || undefined);
    setShowCancelInput(false);
    setCancelMemo("");
  };

  const meta = STATUS_META[r.status];

  return (
    <div className="rounded-2xl border border-black/8 bg-background p-4">
      {/* 카드 헤더: 상태 배지 + 시간 + 삭제 버튼 */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
          {meta.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTime(r.startAt)} ~ {formatTime(r.endAt)}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {isDeletable && !showDeleteConfirm && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </button>
          )}
          {showDeleteConfirm && (
            <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1">
              <p className="text-xs text-red-600">삭제할까요?</p>
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
      </div>

      {/* 카드 바디 */}
      <div className="mt-2 flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{r.beautyServiceName}</h3>
          <p className="text-xs text-muted-foreground">
            {r.staffName} · {r.customerName} ({r.customerPhone})
          </p>
          {r.adminMemo && (
            <p className="text-xs text-muted-foreground">메모: {r.adminMemo}</p>
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
