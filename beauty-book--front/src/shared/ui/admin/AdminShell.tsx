"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarRange,
  ChartNoAxesColumn,
  CircleUserRound,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Scissors,
  UserRoundSearch,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

type AdminShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
};

type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const adminNavItems: AdminNavItem[] = [
  {
    href: "/dashboard",
    label: "대시보드",
    description: "오늘 운영 현황과 예약을 한눈에 봅니다.",
    icon: LayoutDashboard,
  },
  {
    href: "/reservations",
    label: "예약 현황",
    description: "날짜별 전체 예약을 조회하고 승인합니다.",
    icon: CalendarDays,
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

export function AdminShell({
  eyebrow = "Admin",
  title,
  description,
  action,
  children,
  aside,
}: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("sidebar-collapsed") === "true"
  );

  const collapse = (v: boolean) => {
    setCollapsed(v);
    localStorage.setItem("sidebar-collapsed", String(v));
  };
  const normalizedPathname =
    pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : pathname;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[1760px] gap-3 px-2 py-5 lg:px-3">
      {/* 사이드바 */}
      <aside className={cn("hidden shrink-0 lg:block transition-all duration-300", collapsed ? "w-[3.5rem]" : "w-[16rem]")}>
        <div className="sticky top-20 rounded-3xl border border-black/12 bg-sidebar/90 p-3 shadow-sm">
          {collapsed ? (
            /* 일자바 모드 */
            <div className="flex flex-col items-center gap-1.5">
              {/* 헤더 아이콘 */}
              <Link
                href="/dashboard"
                title="대시보드 홈"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                  normalizedPathname === "/dashboard"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-black/10 bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Link>

              <div className="my-1 h-px w-8 bg-black/8" />

              {/* 메뉴 아이콘들 */}
              {adminNavItems.map(({ href, label, icon: Icon }) => {
                const normalizedHref = href !== "/" ? href.replace(/\/+$/, "") || "/" : href;
                const active =
                  normalizedPathname === normalizedHref ||
                  Boolean(
                    normalizedPathname &&
                      normalizedHref !== "/" &&
                      normalizedPathname.startsWith(`${normalizedHref}/`)
                  );
                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                      active
                        ? "border-transparent bg-foreground/80 text-white shadow-sm"
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
                href="/dashboard"
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3 transition-colors",
                  normalizedPathname === "/dashboard"
                    ? "border-primary/30 bg-primary/10"
                    : "border-black/12 hover:border-primary/20 hover:bg-primary/5"
                )}
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  BeautyBook
                </p>
                <span className="text-sm font-semibold text-foreground">관리자 센터</span>
              </Link>

              <nav className="mt-3 space-y-1">
                {adminNavItems.map(({ href, label, icon: Icon }) => {
                  const normalizedHref = href !== "/" ? href.replace(/\/+$/, "") || "/" : href;
                  const active =
                    normalizedPathname === normalizedHref ||
                    Boolean(
                      normalizedPathname &&
                        normalizedHref !== "/" &&
                        normalizedPathname.startsWith(`${normalizedHref}/`)
                    );
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all",
                        active
                          ? "border-transparent bg-foreground/80 text-white shadow-md"
                          : "border-black/8 bg-background/50 text-muted-foreground hover:border-black/15 hover:bg-background/80 hover:text-foreground"
                      )}
                    >
                      <span className={cn("inline-flex rounded-xl p-2", active ? "bg-background/15 text-white" : "bg-muted/60 text-muted-foreground")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className={cn("text-sm font-semibold", active ? "text-white" : "text-foreground")}>
                        {label}
                      </span>
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

      {/* 메인 */}
      <section className="min-w-0 flex-1 space-y-6">
        <header className="rounded-3xl border border-black/12 bg-gradient-to-br from-background via-background to-muted/30 p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
            {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
          </div>
        </header>

        <div className={cn("grid gap-4", aside ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1")}>
          <div className="min-w-0">{children}</div>
          {aside && <div className="min-w-0">{aside}</div>}
        </div>
      </section>
    </main>
  );
}
