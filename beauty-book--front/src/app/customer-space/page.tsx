"use client";

import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MessageCircleMore,
  Scissors,
  Sparkles,
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

// ── 영업 스케쥴 카드 ──────────────────────────────────────────────────────────

function BusinessScheduleCard() {
  const today = todayDow();

  const { data: hours = [] } = useQuery<BusinessHourItem[]>({
    queryKey: ["business-hours"],
    queryFn: () =>
      api.get<BusinessHourItem[]>("/api/schedules/business-hours").then((r) => r.data),
  });

  const todayItem = hours.find((h) => h.dayOfWeek === today);
  const isOpenToday = todayItem && !todayItem.closed;

  return (
    <div className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-2xl bg-primary/10 p-2.5 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-foreground">영업 스케쥴</h2>
        </div>
        {todayItem && (
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              isOpenToday ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
            ].join(" ")}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                isOpenToday ? "bg-emerald-500" : "bg-rose-500",
              ].join(" ")}
            />
            {isOpenToday ? "오늘 영업 중" : "오늘 휴무"}
          </span>
        )}
      </div>

      {/* 요일 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {ALL_DAYS.map((day) => {
          const item = hours.find((h) => h.dayOfWeek === day);
          const isToday = day === today;
          const isOpen = item && !item.closed;
          return (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span
                className={[
                  "text-xs font-medium",
                  day === "SATURDAY" ? "text-blue-500" : "",
                  day === "SUNDAY" ? "text-rose-500" : "",
                  isToday && day !== "SATURDAY" && day !== "SUNDAY"
                    ? "text-primary"
                    : "",
                  !isToday && day !== "SATURDAY" && day !== "SUNDAY"
                    ? "text-muted-foreground"
                    : "",
                ].join(" ")}
              >
                {DAY_SHORT[day]}
              </span>
              <div
                className={[
                  "flex h-9 w-full flex-col items-center justify-center rounded-xl text-[10px] font-medium transition-colors",
                  isToday
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isOpen
                    ? "bg-muted/60 text-foreground"
                    : "bg-muted/20 text-muted-foreground/50",
                ].join(" ")}
              >
                {!item ? "—" : item.closed ? "휴무" : (
                  <>
                    <span>{toHHMM(item.openTime)}</span>
                    <span className="opacity-60">~</span>
                    <span>{toHHMM(item.closeTime)}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 디자이너 스케쥴 카드 ──────────────────────────────────────────────────────

function DesignerScheduleCard() {
  const today = todayDow();

  const { data: schedules = [] } = useQuery<StaffSchedule[]>({
    queryKey: ["staff-working-hours"],
    queryFn: () =>
      api.get<StaffSchedule[]>("/api/schedules/staff-working-hours").then((r) => r.data),
  });

  return (
    <div className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-2xl bg-primary/10 p-2.5 text-primary">
          <Users className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-foreground">디자이너 스케쥴</h2>
      </div>

      {schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">스케쥴 정보가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {schedules.map((staff) => {
            const todayWork = staff.workingDays.find((d) => d.dayOfWeek === today);
            const worksToday = todayWork?.working ?? false;

            return (
              <div
                key={staff.staffId}
                className="flex items-center gap-3 rounded-xl border border-black/8 bg-muted/20 px-3 py-2.5"
              >
                {/* 아바타 */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {staff.staffName.slice(0, 1)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{staff.staffName}</p>
                  {worksToday && todayWork?.startTime ? (
                    <p className="text-xs text-muted-foreground">
                      {toHHMM(todayWork.startTime)} ~ {toHHMM(todayWork.endTime)}
                    </p>
                  ) : null}
                </div>

                {/* 오늘 출근 여부 */}
                <span
                  className={[
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    worksToday
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {worksToday ? "오늘 출근" : "오늘 휴무"}
                </span>

                {/* 요일 점 표시 */}
                <div className="flex gap-0.5">
                  {ALL_DAYS.map((day) => {
                    const w = staff.workingDays.find((d) => d.dayOfWeek === day);
                    const isToday = day === today;
                    return (
                      <div
                        key={day}
                        title={`${DAY_SHORT[day]}요일`}
                        className={[
                          "h-1.5 w-1.5 rounded-full transition-colors",
                          w?.working
                            ? isToday
                              ? "bg-primary"
                              : "bg-primary/30"
                            : "bg-muted/40",
                        ].join(" ")}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 퀵액션 카드 ───────────────────────────────────────────────────────────────

const quickActions = [
  {
    href: "/my-reservations",
    title: "내 예약 확인",
    description: "승인 대기, 확정, 취소 상태를 바로 확인합니다.",
    icon: CalendarDays,
  },
  {
    href: "/services",
    title: "시술/가격 보기",
    description: "예약 전에 필요한 최소 서비스 정보를 확인합니다.",
    icon: Scissors,
  },
  {
    href: "/designers",
    title: "디자이너 소개",
    description: "담당 디자이너의 스타일과 강점을 비교합니다.",
    icon: Sparkles,
  },
];

// ── 사이드바 영업시간 카드 ────────────────────────────────────────────────────

function BusinessHoursCard() {
  const today = todayDow();

  const { data: hours = [] } = useQuery<BusinessHourItem[]>({
    queryKey: ["business-hours"],
    queryFn: () =>
      api.get<BusinessHourItem[]>("/api/schedules/business-hours").then((r) => r.data),
  });

  const todayItem = hours.find((h) => h.dayOfWeek === today);
  const isOpenToday = todayItem && !todayItem.closed;

  return (
    <article className="rounded-2xl border border-black/12 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Clock className="h-4 w-4" />
        영업시간
      </div>

      {todayItem && (
        <div
          className={[
            "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            isOpenToday ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-1.5 w-1.5 rounded-full",
              isOpenToday ? "bg-emerald-500" : "bg-rose-500",
            ].join(" ")}
          />
          {isOpenToday
            ? `오늘 ${toHHMM(todayItem.openTime)} ~ ${toHHMM(todayItem.closeTime)}`
            : "오늘 휴무"}
        </div>
      )}

      <div className="mt-4 space-y-1">
        {ALL_DAYS.map((day) => {
          const item = hours.find((h) => h.dayOfWeek === day);
          const isToday = day === today;
          return (
            <div
              key={day}
              className={[
                "flex items-center justify-between rounded-lg px-3 py-1.5 text-sm",
                isToday ? "bg-primary/8 font-semibold" : "",
              ].join(" ")}
            >
              <span
                className={[
                  day === "SATURDAY" ? "text-blue-600" : "",
                  day === "SUNDAY" ? "text-rose-600" : "",
                  isToday ? "text-primary" : "text-muted-foreground",
                ].join(" ")}
              >
                {DAY_SHORT[day]}
              </span>
              <span
                className={[
                  item?.closed ? "text-rose-500" : isToday ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {!item
                  ? "—"
                  : item.closed
                  ? "휴무"
                  : `${toHHMM(item.openTime)} ~ ${toHHMM(item.closeTime)}`}
              </span>
            </div>
          );
        })}
      </div>
    </article>
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
          <div className="space-y-4">
            <BusinessHoursCard />

            <article className="rounded-2xl border border-black/12 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageCircleMore className="h-4 w-4" />
                상담 채팅 바로가기
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-black/10 bg-muted/20 p-3 text-sm text-muted-foreground">
                  원하는 시간대가 없으면 채팅으로 일정 조율을 요청할 수 있습니다.
                </div>
                <div className="rounded-2xl border border-black/10 bg-background p-3 text-sm text-foreground">
                  "주말 오전 타임이 비면 알려주세요."
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  채팅 열기
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-black/12 bg-card p-6 shadow-sm">
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
        <div className="space-y-4">
          {/* 영업/디자이너 스케쥴 */}
          <BusinessScheduleCard />
          <DesignerScheduleCard />

          {/* 빠른 이동 */}
          <section className="grid gap-3 sm:grid-cols-3">
            {quickActions.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm transition-colors hover:bg-accent"
              >
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
              </Link>
            ))}
          </section>

          {/* 이용 안내 */}
          <section className="rounded-2xl border border-black/12 bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">미용실 이용 안내</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "예약 시작 전 시술/가격과 디자이너 정보를 먼저 볼 수 있습니다.",
                "예약 후에는 승인 대기, 확정, 취소 상태를 내 예약에서 확인합니다.",
                "시간이 맞지 않으면 상담 채팅으로 일정 조율을 요청할 수 있습니다.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-dashed border-black/15 bg-muted/20 px-4 py-5 text-sm leading-6 text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
