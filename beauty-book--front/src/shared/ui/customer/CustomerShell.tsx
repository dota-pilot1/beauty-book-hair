"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck2,
  CircleUserRound,
  LayoutGrid,
  Scissors,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

type CustomerShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
  showSidebarIntro?: boolean;
  showHeader?: boolean;
};

type CustomerNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const customerNavItems: CustomerNavItem[] = [
  {
    href: "/customer-space",
    label: "미용실 소개",
    description: "매장 소개, 빠른 예약 시작, 상담과 최근 상태를 봅니다.",
    icon: LayoutGrid,
  },
  {
    href: "/booking",
    label: "예약하기",
    description: "서비스, 디자이너, 날짜와 시간을 선택합니다.",
    icon: CalendarCheck2,
  },
  {
    href: "/my-reservations",
    label: "내 예약",
    description: "승인 대기, 확정, 취소 상태를 확인합니다.",
    icon: Sparkles,
  },
  {
    href: "/services",
    label: "시술/가격",
    description: "예약 전에 필요한 최소 서비스 정보를 봅니다.",
    icon: Scissors,
  },
  {
    href: "/designers",
    label: "디자이너",
    description: "담당 디자이너의 스타일과 강점을 확인합니다.",
    icon: UserRoundSearch,
  },
  {
    href: "/my-info",
    label: "내 정보",
    description: "연락처, 요청사항, 기본 프로필을 관리합니다.",
    icon: CircleUserRound,
  },
];

export function CustomerShell({
  eyebrow = "Customer Workspace",
  title,
  description,
  action,
  children,
  aside,
  showSidebarIntro = true,
  showHeader = true,
}: CustomerShellProps) {
  const pathname = usePathname();
  const normalizedPathname =
    pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : pathname;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[1760px] gap-3 px-2 py-5 lg:px-3">
      <aside className="hidden w-[16rem] shrink-0 lg:block">
        <div className="sticky top-20 rounded-3xl border border-black/12 bg-sidebar/90 p-4 shadow-sm">
          {showSidebarIntro ? (
            <Link
              href="/customer-space"
              className={cn(
                "block rounded-2xl border bg-background/70 p-4 transition-colors",
                normalizedPathname === "/customer-space"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-black/12 hover:border-primary/20 hover:bg-primary/5"
              )}
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                BeautyBook
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                미용실 소개
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                매장 분위기와 시술 정보를 보고 예약을 시작합니다.
              </p>
            </Link>
          ) : null}

          <nav className={cn("space-y-2", showSidebarIntro ? "mt-4" : "mt-0")}>
            {customerNavItems.map(({ href, label, description, icon: Icon }) => {
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
                    "relative block rounded-2xl border px-4 py-3 transition-all",
                    active
                      ? "border-transparent bg-foreground/80 text-white shadow-md"
                      : "border-black/8 bg-background/50 text-muted-foreground hover:border-black/15 hover:bg-background/80 hover:text-foreground"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex rounded-xl p-2",
                        active ? "bg-background/15 text-white" : "bg-muted/60 text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold", active ? "text-white" : "text-foreground")}>{label}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs leading-5",
                          active ? "text-white/80" : "text-muted-foreground"
                        )}
                      >
                        {description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <section className="min-w-0 flex-1 space-y-6">
        {showHeader ? (
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
              {action ? <div className="flex shrink-0 items-center gap-3">{action}</div> : null}
            </div>
          </header>
        ) : null}

        <div className={cn("grid gap-4", aside ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1")}>
          <div className="min-w-0">{children}</div>
          {aside ? (
            <div className="min-w-0">
              <div className="xl:sticky xl:top-6">{aside}</div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
