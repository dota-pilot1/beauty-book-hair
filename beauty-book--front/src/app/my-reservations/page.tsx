"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { AlertDialog } from "@/shared/ui/AlertDialog";
import { useMyReservations, useChangeReservationStatus, useDeleteReservation } from "@/entities/reservation/model/useReservations";
import { useAuth } from "@/entities/user/model/authStore";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";

const STATUS_META: Record<ReservationStatus, { label: string; badge: string; card: string }> = {
  REQUESTED:             { label: "승인 대기",  badge: "border border-black/30 bg-white text-foreground",                card: "border-black/12 bg-white" },
  CONFIRMED:             { label: "예약 확정",  badge: "border border-black bg-black text-white",                       card: "border-black/70 bg-white" },
  CANCELLED_BY_CUSTOMER: { label: "고객 취소",  badge: "border border-black/12 bg-black/[0.03] text-foreground/40",     card: "border-black/8 bg-black/[0.015]" },
  CANCELLED_BY_ADMIN:    { label: "관리자취소", badge: "border border-black/12 bg-black/[0.03] text-foreground/40",     card: "border-black/8 bg-black/[0.015]" },
  COMPLETED:             { label: "완료",       badge: "border border-black/12 bg-black/[0.03] text-foreground/40",     card: "border-black/8 bg-black/[0.015]" },
  NO_SHOW:               { label: "노쇼",       badge: "border border-rose-300 bg-rose-50 text-rose-600",               card: "border-rose-200 bg-rose-50/30" },
};

type Tab = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "OTHER";

const TABS: { key: Tab; label: string }[] = [
  { key: "REQUESTED",  label: "승인 대기" },
  { key: "CONFIRMED",  label: "예약 확정" },
  { key: "COMPLETED",  label: "완료" },
  { key: "OTHER",      label: "그외" },
];

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric", day: "numeric", weekday: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "numeric", day: "numeric",
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
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [pendingDelete, setPendingDelete] = useState<Reservation | null>(null);
  const changeStatus = useChangeReservationStatus();
  const deleteReservation = useDeleteReservation();

  const counts: Record<Tab, number> = {
    REQUESTED: reservations.filter((r) => r.status === "REQUESTED").length,
    CONFIRMED: reservations.filter((r) => r.status === "CONFIRMED").length,
    COMPLETED: reservations.filter((r) => r.status === "COMPLETED").length,
    OTHER:     reservations.filter((r) => !["REQUESTED", "CONFIRMED", "COMPLETED"].includes(r.status)).length,
  };

  const list = reservations.filter((r) => {
    if (tab === "REQUESTED") return r.status === "REQUESTED";
    if (tab === "CONFIRMED") return r.status === "CONFIRMED";
    if (tab === "COMPLETED") return r.status === "COMPLETED";
    return !["REQUESTED", "CONFIRMED", "COMPLETED"].includes(r.status);
  });

  const handleAction = (r: Reservation) => {
    if (r.status === "REQUESTED") {
      setPendingDelete(r);
      return;
    }
    changeStatus.mutate(
      { id: r.id, status: "CANCELLED_BY_CUSTOMER" },
      {
        onSuccess: () => toast.success("예약이 취소되었습니다."),
        onError: () => toast.error("예약 취소에 실패했습니다. 다시 시도해 주세요."),
      }
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteReservation.mutate(pendingDelete.id, {
      onSuccess: () => toast.success("예약 요청이 삭제되었습니다."),
      onError: () => toast.error("삭제에 실패했습니다. 다시 시도해 주세요."),
    });
    setPendingDelete(null);
  };

  const isPending = changeStatus.isPending || deleteReservation.isPending;

  return (
    <CustomerShell
      eyebrow="My Reservations"
      title="내 예약"
      description="승인 대기, 확정, 지난 예약을 확인합니다."
      showSidebarIntro={false}
      showHeader={false}
    >
      <AlertDialog
        open={!!pendingDelete}
        variant="error"
        title="예약 요청을 삭제할까요?"
        description={
          pendingDelete
            ? `${pendingDelete.beautyServiceName} · ${formatDateTime(pendingDelete.startAt)}\n\n삭제하면 이력이 남지 않으며 복구할 수 없습니다.`
            : undefined
        }
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

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

        {/* 탭 + 뷰 토글 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
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

          {/* 그리드/리스트 토글 */}
          <div className="flex h-8 items-stretch rounded-md border border-black/12 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`flex w-8 items-center justify-center transition-colors ${
                viewMode === "card"
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground/40 hover:text-foreground/70"
              }`}
              aria-label="카드 보기"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex w-8 items-center justify-center border-l border-black/12 transition-colors ${
                viewMode === "list"
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground/40 hover:text-foreground/70"
              }`}
              aria-label="목록 보기"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className={viewMode === "card" ? "grid gap-3 sm:grid-cols-2" : "rounded-xl border border-black/12 bg-white overflow-hidden divide-y divide-black/[0.06]"}>
            {Array.from({ length: 4 }).map((_, i) =>
              viewMode === "card" ? (
                <div key={i} className="h-36 animate-pulse rounded-xl bg-black/[0.04]" />
              ) : (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-black/[0.07]" />
                  <div className="h-3 w-40 animate-pulse rounded bg-black/[0.05]" />
                </div>
              )
            )}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-black/12 bg-white py-12 text-center">
            <p className="text-xs text-foreground/35">
              {tab === "REQUESTED" && "승인 대기 중인 예약이 없습니다."}
              {tab === "CONFIRMED" && "확정된 예약이 없습니다."}
              {tab === "COMPLETED" && "완료된 예약이 없습니다."}
              {tab === "OTHER" && "취소 · 노쇼 예약이 없습니다."}
            </p>
          </div>
        ) : viewMode === "card" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onAction={["REQUESTED", "CONFIRMED"].includes(r.status) ? () => handleAction(r) : undefined}
                actionLabel={r.status === "REQUESTED" ? "삭제" : "취소"}
                isPending={isPending}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-black/12 bg-white overflow-hidden">
            <div className="divide-y divide-black/[0.06]">
              {list.map((r) => (
                <ReservationRow
                  key={r.id}
                  reservation={r}
                  onAction={["REQUESTED", "CONFIRMED"].includes(r.status) ? () => handleAction(r) : undefined}
                  actionLabel={r.status === "REQUESTED" ? "삭제" : "취소"}
                  isPending={isPending}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}

// ── 카드 뷰 ──────────────────────────────────────────────────

function ReservationCard({
  reservation: r,
  onAction,
  actionLabel = "취소",
  isPending,
}: {
  reservation: Reservation;
  onAction?: () => void;
  actionLabel?: string;
  isPending: boolean;
}) {
  const meta = STATUS_META[r.status];
  const items = r.items?.length
    ? r.items
    : [{ id: null, beautyServiceId: r.beautyServiceId, beautyServiceName: r.beautyServiceName, durationMinutes: 0, price: 0, displayOrder: 0 }];
  const main = items[0];
  const options = items.slice(1);
  const totalDuration = items.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
  const totalPrice = items.reduce((s, i) => s + Number(i.price ?? 0), 0);
  const isMuted = ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_ADMIN", "COMPLETED", "NO_SHOW"].includes(r.status);

  return (
    <div className={`flex flex-col rounded-xl border p-4 transition-colors ${meta.card}`}>
      {/* 상단: 상태 배지 + 액션 버튼 */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
          {meta.label}
        </span>
        {onAction && (
          <button
            type="button"
            disabled={isPending}
            onClick={onAction}
            className={`h-6 rounded border px-2.5 text-[11px] font-medium transition-colors disabled:opacity-30 ${
              actionLabel === "삭제"
                ? "border-rose-300 text-rose-500 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
                : "border-black/20 text-foreground/50 hover:border-black/35 hover:text-foreground/80"
            }`}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {/* 시술명 */}
      <div className="min-w-0">
        <p className={`text-base font-semibold leading-snug truncate ${isMuted ? "text-foreground/40" : "text-foreground"}`}>
          {main.beautyServiceName}
        </p>
        {options.length > 0 && (
          <p className="mt-0.5 text-xs text-foreground/40 truncate">
            + 옵션 {options.map((o) => o.beautyServiceName).join(", ")}
          </p>
        )}
      </div>

      {/* 구분선 */}
      <div className="my-3 border-t border-black/[0.06]" />

      {/* 하단 정보 */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-medium ${isMuted ? "text-foreground/30" : "text-foreground/50"}`}>디자이너</span>
          <span className={`text-[11px] ${isMuted ? "text-foreground/35" : "text-foreground/70"}`}>{r.staffName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-medium ${isMuted ? "text-foreground/30" : "text-foreground/50"}`}>일시</span>
          <span className={`text-[11px] ${isMuted ? "text-foreground/35" : "text-foreground/70"}`}>{formatDateTime(r.startAt)}</span>
        </div>
        {totalDuration > 0 && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-medium ${isMuted ? "text-foreground/30" : "text-foreground/50"}`}>소요</span>
            <span className={`text-[11px] ${isMuted ? "text-foreground/35" : "text-foreground/70"}`}>
              {totalDuration}분{totalPrice > 0 ? ` · ${totalPrice.toLocaleString()}원` : ""}
            </span>
          </div>
        )}
      </div>

      {/* 신청일 */}
      <p className="mt-3 text-[10px] text-foreground/25">신청 {formatDate(r.createdAt)}</p>
    </div>
  );
}

// ── 리스트 뷰 ─────────────────────────────────────────────────

function ReservationRow({
  reservation: r,
  onAction,
  actionLabel = "취소",
  isPending,
}: {
  reservation: Reservation;
  onAction?: () => void;
  actionLabel?: string;
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
      <div className="flex shrink-0 items-center gap-2">
        {onAction && (
          <button
            type="button"
            disabled={isPending}
            onClick={onAction}
            className={`h-6 rounded border px-2 text-[11px] font-medium transition-colors disabled:opacity-30 ${
              actionLabel === "삭제"
                ? "border-rose-300 text-rose-500 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
                : "border-black/20 text-foreground/50 hover:border-black/30 hover:text-foreground/70"
            }`}
          >
            {actionLabel}
          </button>
        )}
        <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}
