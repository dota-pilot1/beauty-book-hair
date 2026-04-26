"use client";

import Link from "next/link";
import { CalendarDays, Clock, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { useAuth } from "@/entities/user/model/authStore";
import {
  useReservationsByDate,
  useChangeReservationStatus,
} from "@/entities/reservation/model/useReservations";
import type { Reservation, ReservationStatus } from "@/entities/reservation/model/types";
import { api } from "@/shared/api/axios";
import { useMemo, useState } from "react";

// ── 주간 스케줄 타입/상수 ────────────────────────────────────────────────────────

type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

type BusinessHourItem = {
  id: number;
  dayOfWeek: DayOfWeek;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
};

type WorkingDay = {
  dayOfWeek: DayOfWeek;
  startTime: string | null;
  endTime: string | null;
  working: boolean;
};

type StaffSchedule = {
  staffId: number;
  staffName: string;
  profileImageUrl: string | null;
  workingDays: WorkingDay[];
};

const ALL_DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];

const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "월", TUESDAY: "화", WEDNESDAY: "수", THURSDAY: "목",
  FRIDAY: "금", SATURDAY: "토", SUNDAY: "일",
};

const JS_DAY_TO_DOW: Record<number, DayOfWeek> = {
  0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
  4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
};

function todayDow(): DayOfWeek {
  return JS_DAY_TO_DOW[new Date().getDay()];
}

function toHHMM(time: string | null) {
  if (!time) return null;
  return time.slice(0, 5);
}

// ── 주간 스케줄 카드 ──────────────────────────────────────────────────────────

function WeeklyScheduleCard() {
  const today = todayDow();

  const { data: hours = [] } = useQuery<BusinessHourItem[]>({
    queryKey: ["business-hours"],
    queryFn: () =>
      api.get<BusinessHourItem[]>("/api/schedules/business-hours").then((r) => r.data),
  });

  const { data: schedules = [] } = useQuery<StaffSchedule[]>({
    queryKey: ["staff-working-hours"],
    queryFn: () =>
      api.get<StaffSchedule[]>("/api/schedules/staff-working-hours").then((r) => r.data),
  });

  const todayItem = hours.find((h) => h.dayOfWeek === today);
  const isOpenToday = todayItem && !todayItem.closed;

  return (
    <div className="rounded-2xl border border-black/12 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-primary/10 p-2 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-foreground">이번 주 스케줄</h2>
        </div>
        {todayItem && (
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              isOpenToday ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
            ].join(" ")}
          >
            <span className={["h-1.5 w-1.5 rounded-full", isOpenToday ? "bg-emerald-500" : "bg-rose-500"].join(" ")} />
            {isOpenToday ? "오늘 영업 중" : "오늘 휴무"}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="w-20 shrink-0" />
              {ALL_DAYS.map((day) => {
                const isToday = day === today;
                return (
                  <th
                    key={day}
                    className={[
                      "px-2 py-3 text-center text-xs font-semibold",
                      isToday ? "bg-primary/8" : "",
                      day === "SATURDAY" ? "text-blue-600" : "",
                      day === "SUNDAY" ? "text-rose-600" : "",
                      !isToday && day !== "SATURDAY" && day !== "SUNDAY" ? "text-muted-foreground" : "",
                      isToday && day !== "SATURDAY" && day !== "SUNDAY" ? "text-primary" : "",
                    ].join(" ")}
                  >
                    <span>{DAY_SHORT[day]}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-black/8 bg-muted/20">
              <td className="px-3 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  영업
                </div>
              </td>
              {ALL_DAYS.map((day) => {
                const item = hours.find((h) => h.dayOfWeek === day);
                const isToday = day === today;
                return (
                  <td key={day} className={["px-1 py-2.5 text-center", isToday ? "bg-primary/8" : ""].join(" ")}>
                    {!item ? (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    ) : item.closed ? (
                      <span className="inline-flex rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">휴무</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground leading-tight block">
                        {toHHMM(item.openTime)}<br />~{toHHMM(item.closeTime)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {schedules.length === 0 ? (
              <tr className="border-t border-black/8">
                <td colSpan={8} className="px-3 py-4 text-center text-xs text-muted-foreground">
                  디자이너 스케줄 정보가 없습니다.
                </td>
              </tr>
            ) : (
              schedules.map((staff, idx) => (
                <tr key={staff.staffId} className={["border-t border-black/8", idx % 2 === 0 ? "" : "bg-muted/10"].join(" ")}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                        {staff.staffName.slice(0, 1)}
                      </div>
                      <span className="text-xs font-medium text-foreground whitespace-nowrap">{staff.staffName}</span>
                    </div>
                  </td>
                  {ALL_DAYS.map((day) => {
                    const w = staff.workingDays.find((d) => d.dayOfWeek === day);
                    const isToday = day === today;
                    const works = w?.working ?? false;
                    return (
                      <td key={day} className={["px-1 py-2.5 text-center", isToday ? "bg-primary/8" : ""].join(" ")}>
                        {works ? (
                          <span className={[
                            "inline-flex items-center justify-center rounded-full text-[10px] font-semibold px-1.5 py-0.5",
                            isToday ? "bg-primary text-primary-foreground" : "bg-emerald-50 text-emerald-700",
                          ].join(" ")}>
                            {staff.staffName.slice(0, 1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/25 text-xs">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function useTodayWorkingStaffCount() {
  const today = todayDow();
  const { data: schedules = [] } = useQuery<StaffSchedule[]>({
    queryKey: ["staff-working-hours"],
    queryFn: () =>
      api.get<StaffSchedule[]>("/api/schedules/staff-working-hours").then((r) => r.data),
  });
  return schedules.filter((s) =>
    s.workingDays.find((d) => d.dayOfWeek === today)?.working === true
  ).length;
}

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
  const workingStaffCount = useTodayWorkingStaffCount();

  const requested = todayReservations.filter((r) => r.status === "REQUESTED").length;
  const confirmed = todayReservations.filter((r) => r.status === "CONFIRMED").length;

  return (
    <AdminShell
      eyebrow="Admin Dashboard"
      title={`${user?.username ?? "운영자"}님, 오늘 운영 현황입니다.`}
      description="오늘 예약 현황을 확인하고 승인·완료·노쇼를 처리합니다."
      action={
        <div className="flex items-center gap-2">
          <Link
            href="/customer-space"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            예약 홈
          </Link>
          <Link
            href="/reservations"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            전체 예약 보기
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 이번 주 스케줄 */}
        <WeeklyScheduleCard />

        {/* 통계 */}
        <section className="grid gap-3 md:grid-cols-4">
          {[
            { label: "오늘 전체 예약", value: isLoading ? "…" : String(todayReservations.length) },
            { label: "승인 대기",      value: isLoading ? "…" : String(requested) },
            { label: "예약 확정",      value: isLoading ? "…" : String(confirmed) },
            { label: "근무 직원",      value: workingStaffCount > 0 ? String(workingStaffCount) : "—" },
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
