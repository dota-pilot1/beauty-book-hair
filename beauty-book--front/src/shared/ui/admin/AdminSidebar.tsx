"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  CalendarX2,
  ChartNoAxesColumn,
  CircleUserRound,
  LayoutDashboard,
  MonitorCog,
  Newspaper,
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
    href: "/site-settings",
    label: "화면 관리",
    description: "대문 이미지와 소개 문구를 수정합니다.",
    icon: MonitorCog,
  },
  {
    href: "/board-management",
    label: "게시판 관리",
    description: "게시판과 게시글을 관리합니다.",
    icon: Newspaper,
  },
  {
    href: "/blog-management",
    label: "블로그 관리",
    description: "헤어 다이어리 포스트를 관리합니다.",
    icon: BookOpen,
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
    <aside
      className={cn(
        "hidden shrink-0 lg:block transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[3.5rem]" : "w-[16rem]"
      )}
    >
      {/* 컨테이너: collapsed 시 flex col items-center */}
      <div
        className={cn(
          "sticky top-20 rounded-3xl border border-black/12 bg-sidebar/90 shadow-sm transition-[padding] duration-300",
          collapsed ? "p-2 flex flex-col items-center gap-1.5" : "p-3"
        )}
      >
        {/* 헤더 */}
        <Link
          href="/admin/dashboard"
          title={collapsed ? "대시보드 홈" : undefined}
          className={cn(
            "flex shrink-0 items-center overflow-hidden border bg-background/70 transition-all duration-300 ease-in-out",
            collapsed
              ? cn(
                  "h-10 w-10 justify-center rounded-xl",
                  pathname === "/admin/dashboard"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-black/10 text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              : cn(
                  "w-full rounded-2xl p-4",
                  pathname === "/admin/dashboard"
                    ? "border-black/18 bg-accent/70"
                    : "border-black/12 hover:border-black/20 hover:bg-accent"
                )
          )}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          <div
            className={cn(
              "overflow-hidden transition-all ease-in-out",
              collapsed
                ? "w-0 opacity-0 duration-[100ms]"
                : "w-full opacity-100 duration-200 delay-[160ms] ml-3"
            )}
          >
            <p className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              BeautyBook
            </p>
            <h2 className="mt-2 whitespace-nowrap text-xl font-semibold tracking-tight text-foreground">
              관리자 센터
            </h2>
          </div>
        </Link>

        {/* 구분선 (collapsed only) */}
        {collapsed && <div className="h-px w-8 bg-black/8" />}

        {/* 메뉴 */}
        <nav
          className={cn(
            "flex flex-col",
            collapsed ? "items-center gap-1.5 w-full" : "w-full mt-3 gap-1.5"
          )}
        >
          {adminNavItems.map(({ href, label, description, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "relative flex shrink-0 items-center overflow-hidden border transition-all duration-300 ease-in-out",
                  collapsed
                    ? cn(
                        "h-10 w-10 justify-center rounded-xl",
                        active
                          ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                          : "border-black/8 bg-background/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                      )
                    : cn(
                        "w-full rounded-2xl px-3 py-3",
                        active
                          ? "border-black/18 bg-accent/70"
                          : "border-black/10 bg-background/60 hover:border-black/20 hover:bg-accent"
                      )
                )}
              >
                {/* 활성 인디케이터 */}
                <span
                  className={cn(
                    "absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-primary transition-opacity duration-200",
                    active && !collapsed ? "opacity-100 delay-[200ms]" : "opacity-0"
                  )}
                />
                {/* 아이콘 */}
                <span
                  className={cn(
                    "shrink-0 inline-flex rounded-xl transition-all duration-300",
                    collapsed
                      ? "p-0"
                      : cn("p-2", active ? "bg-primary/12 text-primary" : "bg-muted text-foreground")
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {/* 텍스트 */}
                <div
                  className={cn(
                    "overflow-hidden transition-all ease-in-out",
                    collapsed
                      ? "w-0 opacity-0 duration-[100ms]"
                      : "w-full opacity-100 duration-200 delay-[160ms] ml-3"
                  )}
                >
                  <p className="whitespace-nowrap text-sm font-medium text-foreground">{label}</p>
                  <p
                    className={cn(
                      "mt-0.5 whitespace-nowrap text-xs",
                      active ? "text-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 구분선 (collapsed only) */}
        {collapsed && <div className="h-px w-8 bg-black/8" />}

        {/* 일자바 토글 */}
        <button
          onClick={() => collapse(!collapsed)}
          title={collapsed ? "메뉴 펼치기" : undefined}
          className={cn(
            "shrink-0 flex items-center overflow-hidden border border-black/10 bg-background/60 text-xs text-muted-foreground transition-all duration-300 ease-in-out hover:border-black/20 hover:bg-accent",
            collapsed
              ? "h-10 w-10 justify-center rounded-xl"
              : "mt-3 w-full rounded-2xl px-3 py-2"
          )}
        >
          <div className="relative h-4 w-4 shrink-0">
            <PanelLeftClose
              className={cn(
                "absolute h-4 w-4 transition-opacity duration-200",
                collapsed ? "opacity-0" : "opacity-100"
              )}
            />
            <PanelLeftOpen
              className={cn(
                "absolute h-4 w-4 transition-opacity duration-200",
                collapsed ? "opacity-100" : "opacity-0"
              )}
            />
          </div>
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all ease-in-out",
              collapsed
                ? "w-0 opacity-0 duration-[100ms]"
                : "w-full opacity-100 duration-200 delay-[160ms] ml-2"
            )}
          >
            일자바 모드
          </span>
        </button>
      </div>
    </aside>
  );
}
