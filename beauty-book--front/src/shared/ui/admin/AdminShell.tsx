"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  ChartNoAxesColumn,
  CircleUserRound,
  Clock,
  GalleryHorizontal,
  LayoutDashboard,
  MailCheck,
  MonitorCog,
  Newspaper,
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
    href: "/schedule",
    label: "영업시간 관리",
    description: "요일별 매장 영업시간을 설정합니다.",
    icon: Clock,
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
    href: "/mail-settings",
    label: "메일 관리",
    description: "예약 요청 알림 수신 이메일을 설정합니다.",
    icon: MailCheck,
  },
  {
    href: "/board-management",
    label: "게시판 관리",
    description: "게시판과 게시글을 관리합니다.",
    icon: Newspaper,
  },
  {
    href: "/gallery-management",
    label: "갤러리 관리",
    description: "시술 사진과 포트폴리오를 관리합니다.",
    icon: GalleryHorizontal,
  },
  {
    href: "/blog-management",
    label: "블로그 관리",
    description: "헤어 다이어리 포스트를 관리합니다.",
    icon: BookOpen,
  },
  {
    href: "/booking?start=1",
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
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[1760px] gap-6 px-4 py-6 lg:px-6">
      {/* 사이드바 */}
      <aside
        className={cn(
          "hidden shrink-0 lg:block transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[3.5rem]" : "w-[16rem]"
        )}
      >
        <div
          className={cn(
            "sticky top-20 rounded-md border border-sidebar-border bg-sidebar shadow-sm transition-[padding] duration-300",
            collapsed ? "p-2 flex flex-col items-center gap-2" : "p-4"
          )}
        >
          {/* 메뉴 */}
          <nav
            className={cn(
              "flex flex-col",
              collapsed ? "items-center gap-2 w-full" : "w-full gap-2"
            )}
          >
            {adminNavItems.map(({ href, label, icon: Icon }) => {
              const hrefPath = href.split("?")[0] ?? href;
              const normalizedHref = hrefPath !== "/" ? hrefPath.replace(/\/+$/, "") || "/" : hrefPath;
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
                  title={collapsed ? label : undefined}
                  className={cn(
                    "shrink-0 flex items-center overflow-hidden border transition-all duration-300 ease-in-out",
                    collapsed
                      ? cn(
                          "h-10 w-10 justify-center rounded-md",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-card text-muted-foreground hover:border-primary hover:bg-accent hover:text-foreground"
                        )
                      : cn(
                          "w-full rounded-md px-3 py-2.5",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border bg-card text-muted-foreground hover:border-primary hover:bg-accent hover:text-foreground"
                        )
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 inline-flex rounded-md transition-all duration-300",
                      collapsed ? "p-0" : cn("p-2", active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground")
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap text-sm font-semibold transition-all ease-in-out",
                      active ? "text-primary-foreground" : "text-foreground",
                      collapsed
                        ? "w-0 opacity-0 duration-[100ms]"
                        : "w-full opacity-100 duration-200 delay-[160ms] ml-3"
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {collapsed && <div className="h-px w-8 bg-border" />}

          {/* 일자바 토글 */}
          <button
            onClick={() => collapse(!collapsed)}
            title={collapsed ? "메뉴 펼치기" : undefined}
            className={cn(
              "shrink-0 flex items-center overflow-hidden border border-border bg-card text-xs text-muted-foreground transition-all duration-300 ease-in-out hover:border-primary hover:bg-accent hover:text-foreground",
              collapsed
                ? "h-10 w-10 justify-center rounded-md"
                : "mt-4 w-full rounded-md px-3 py-2"
            )}
          >
            <div className="relative h-4 w-4 shrink-0">
              <PanelLeftClose
                className={cn("absolute h-4 w-4 transition-opacity duration-200", collapsed ? "opacity-0" : "opacity-100")}
              />
              <PanelLeftOpen
                className={cn("absolute h-4 w-4 transition-opacity duration-200", collapsed ? "opacity-100" : "opacity-0")}
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

      {/* 메인 */}
      <section className="min-w-0 flex-1 space-y-6">
        <header className="rounded-md border border-border bg-card px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
          </div>
        </header>

        <div className={cn("grid gap-6", aside ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1")}>
          <div className="min-w-0">{children}</div>
          {aside && <div className="min-w-0">{aside}</div>}
        </div>
      </section>
    </main>
  );
}
