"use client";

import Link from "next/link";
import {
  Clock,
  MessageCircleMore,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { api } from "@/shared/api/axios";

// ── 타입 ──────────────────────────────────────────────────────────────────────

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

// ── 상수 ──────────────────────────────────────────────────────────────────────

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

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function todayDow(): DayOfWeek {
  return JS_DAY_TO_DOW[new Date().getDay()];
}

function toHHMM(time: string | null) {
  if (!time) return null;
  return time.slice(0, 5);
}

// ── 통합 주간 스케쥴 카드 ─────────────────────────────────────────────────────

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
    <div className="rounded-2xl border border-black/10 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-primary/10 p-2 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-foreground">이번 주 스케쥴</h2>
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

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
        <table className="w-full min-w-[760px] table-fixed text-sm">
          <thead className="bg-muted/35">
            <tr>
              <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                구분
              </th>
              {ALL_DAYS.map((day) => {
                const isToday = day === today;
                return (
                  <th
                    key={day}
                    className={[
                      "px-2 py-3 text-center text-xs font-semibold",
                      isToday ? "bg-primary/8 shadow-[inset_0_-1px_0_rgb(17_24_39_/_0.14)]" : "",
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
            <tr className="border-t border-black/8 bg-muted/15 transition-colors hover:bg-muted/25">
              <td className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  영업
                </div>
              </td>
              {ALL_DAYS.map((day) => {
                const item = hours.find((h) => h.dayOfWeek === day);
                const isToday = day === today;
                return (
                  <td key={day} className={["px-2 py-3 text-center", isToday ? "bg-primary/8" : ""].join(" ")}>
                    {!item ? (
                      <span className="inline-flex h-6 min-w-10 items-center justify-center rounded-md bg-muted/40 px-2 text-xs text-muted-foreground/40">—</span>
                    ) : item.closed ? (
                      <span className="inline-flex h-6 min-w-11 items-center justify-center rounded-md bg-rose-50 px-2 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-100">휴무</span>
                    ) : (
                      <span className="inline-flex min-w-[68px] flex-col items-center justify-center rounded-md bg-sky-50 px-2 py-1 text-[11px] font-medium leading-tight text-sky-700 ring-1 ring-sky-100">
                        <span>{toHHMM(item.openTime)}</span>
                        <span>~{toHHMM(item.closeTime)}</span>
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {schedules.length === 0 ? (
              <tr className="border-t border-black/8">
                <td colSpan={8} className="px-4 py-5 text-center text-xs text-muted-foreground">
                  디자이너 스케쥴 정보가 없습니다.
                </td>
              </tr>
            ) : (
              schedules.map((staff, idx) => (
                <tr key={staff.staffId} className={["border-t border-black/8 transition-colors hover:bg-muted/20", idx % 2 === 0 ? "" : "bg-muted/[0.07]"].join(" ")}>
                  <td className="px-4 py-3">
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
                      <td key={day} className={["px-2 py-3 text-center", isToday ? "bg-primary/8" : ""].join(" ")}>
                        {works ? (
                          <span className={[
                            "inline-flex h-6 min-w-11 items-center justify-center rounded-md px-2 text-[11px] font-semibold",
                            isToday ? "bg-primary text-primary-foreground" : "bg-emerald-50 text-emerald-700",
                          ].join(" ")}>
                            근무
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

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default function CustomerSpacePage() {
  return (
    <RequireAuth>
      <CustomerShell
        eyebrow="Salon Intro"
        title="미용실 소개"
        description="매장 소개와 시술 정보를 확인하고, 바로 예약을 시작하거나 상담 채팅으로 일정 조율을 요청할 수 있습니다."
        showSidebarIntro={false}
        action={
          <>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              예약하기
            </Link>
            <Link
              href="/reservations"
              className="inline-flex items-center justify-center rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              예약 현황
            </Link>
          </>
        }
        aside={
          <div className="space-y-5">
            <article className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageCircleMore className="h-4 w-4" />
                상담 채팅 바로가기
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-black/10 bg-muted/20 p-3 text-sm text-muted-foreground">
                  원하는 시간대가 없으면 채팅으로 일정 조율을 요청할 수 있습니다.
                </div>
                <div className="rounded-2xl border border-black/10 bg-background p-3 text-sm text-foreground">
                  &quot;주말 오전 타임이 비면 알려주세요.&quot;
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-black/15 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  채팅 열기
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm">
              <h2 className="text-sm font-medium text-foreground">최근 예약 상태</h2>
              <div className="mt-4 rounded-2xl border border-black/10 bg-background p-4">
                <p className="text-xs text-muted-foreground">가장 최근 예약</p>
                <p className="mt-1 text-sm font-medium text-foreground">뿌리 염색 · 승인 대기</p>
                <p className="mt-2 text-sm text-muted-foreground">5월 2일 금요일 · 오전 11:30</p>
              </div>
            </article>
          </div>
        }
      >
        <WeeklyScheduleCard />
      </CustomerShell>
    </RequireAuth>
  );
}
