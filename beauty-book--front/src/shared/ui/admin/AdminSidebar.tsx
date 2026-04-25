"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarRange,
  CalendarX2,
  ChartNoAxesColumn,
  CircleUserRound,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Scissors,
  UserRoundSearch,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "대시보드",
    description: "오늘 운영 현황과 예약을 한눈에 봅니다.",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/reservations",
    label: "예약 현황",
    description: "날짜별 전체 예약을 조회하고 승인합니다.",
    icon: CalendarDays,
    exact: true,
  },
  {
    href: "/admin/reservations/deleted",
    label: "예약 현황 (삭제)",
    description: "삭제된 예약 이력을 날짜별로 확인합니다.",
    icon: CalendarX2,
    exact: true,
  },
  {
    href: "/admin/reservations/deleted",
    label: "예약 현황 (삭제)",
    description: "삭제된 예약 이력을 날짜별로 확인합니다.",
    icon: CalendarX2,
  },
  {
    href: "/users",
    label: "고객 관리",
    description: "현재 운영 중인 계정과 역할을 확인합니다.",
    icon: CircleUserRound,
  },
  {
    href: "/staff",
    label: "직원 관리",
    description: "직원 스케줄과 담당 시술을 관리합니다.",
    icon: UserRoundSearch,
  },
  {
    href: "/beauty-services",
    label: "시술/가격",
    description: "서비스 목록과 가격 정보를 관리합니다.",
    icon: Scissors,
  },
  {
    href: "/menu-management",
    label: "메뉴 관리",
    description: "메인 소개 영역과 전역 설정을 수정합니다.",
    icon: ChartNoAxesColumn,
  },
  {
    href: "/booking",
    label: "예약 홈",
    description: "고객 예약 화면을 미리 봅니다.",
    icon: CalendarRange,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("sidebar-collapsed") === "true"
  );

  const collapse = (v: boolean) => {
    setCollapsed(v);
    localStorage.setItem("sidebar-collapsed", String(v));
  };

  return (
    <aside className={cn("hidden shrink-0 lg:block transition-all duration-300", collapsed ? "w-[3.5rem]" : "w-[16rem]")}>
      <div className="sticky top-20 rounded-3xl border border-black/12 bg-sidebar/90 p-3 shadow-sm">
        {collapsed ? (
          /* 일자바 모드 */
          <div className="flex flex-col items-center gap-1.5">
            {/* 헤더 아이콘 */}
            <Link
              href="/admin/dashboard"
              title="대시보드 홈"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                pathname === "/admin/dashboard"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-black/10 bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>

            <div className="my-1 h-px w-8 bg-black/8" />

            {/* 메뉴 아이콘들 */}
            {adminNavItems.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                    active
                      ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                      : "border-black/8 bg-background/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}

            <div className="my-1 h-px w-8 bg-black/8" />

            {/* 펼치기 버튼 */}
            <button
              onClick={() => collapse(false)}
              title="메뉴 펼치기"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/8 bg-background/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* 전체 모드 */
          <>
            <Link
              href="/admin/dashboard"
              className={cn(
                "block rounded-2xl border bg-background/70 p-4 transition-colors",
                pathname === "/admin/dashboard"
                  ? "border-black/18 bg-accent/70"
                  : "border-black/12 hover:border-black/20 hover:bg-accent"
              )}
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                BeautyBook
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                관리자 센터
              </h2>
            </Link>

            <nav className="mt-3 space-y-2">
              {adminNavItems.map(({ href, label, description, icon: Icon, exact }) => {
                const active = exact
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block rounded-2xl border px-4 py-3 transition-colors",
                      active
                        ? "border-black/18 bg-accent/70 text-foreground"
                        : "border-black/10 bg-background/60 hover:border-black/20 hover:bg-accent"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full bg-primary" />
                    )}
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-0.5 inline-flex rounded-xl p-2", active ? "bg-primary/12 text-primary" : "bg-muted text-foreground")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className={cn("mt-1 text-xs leading-5", active ? "text-foreground/70" : "text-muted-foreground")}>
                          {description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => collapse(true)}
              className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-black/10 bg-background/60 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-black/20 hover:bg-accent"
            >
              <PanelLeftClose className="h-4 w-4" />
              <span>일자바 모드</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
