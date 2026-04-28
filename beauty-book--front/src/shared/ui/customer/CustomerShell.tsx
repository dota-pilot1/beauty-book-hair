"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck2,
  CalendarDays,
  CircleUserRound,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Scissors,
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
    description: "매장 소개, 스케쥴 확인",
    icon: LayoutGrid,
  },
  {
    href: "/booking?start=1",
    label: "예약하기",
    description: "날짜·시간·디자이너 선택",
    icon: CalendarCheck2,
  },
  {
    href: "/my-reservations",
    label: "내 예약",
    description: "승인 대기, 확정, 취소 상태",
    icon: CalendarDays,
  },
  {
    href: "/services",
    label: "시술/가격",
    description: "시술 종류 및 가격 안내",
    icon: Scissors,
  },
  {
    href: "/designers",
    label: "디자이너",
    description: "디자이너 프로필 보기",
    icon: UserRoundSearch,
  },
  {
    href: "/my-info",
    label: "내 정보",
    description: "프로필 및 요청사항 관리",
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
  showSidebarIntro = false,
  showHeader = true,
}: CustomerShellProps) {
  const pathname = usePathname();
  const normalizedPathname =
    pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : pathname;

  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("customer-sidebar-collapsed") === "true"
  );

  const collapse = (v: boolean) => {
    setCollapsed(v);
    localStorage.setItem("customer-sidebar-collapsed", String(v));
  };

  return (
    <main className={cn("mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[1760px] gap-4 px-3 lg:px-5", showHeader ? "py-5" : "pt-3 pb-5")}>
      <aside
        className={cn(
          "hidden shrink-0 lg:block transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[3.5rem]" : "w-[16rem]"
        )}
      >
        <div
          className={cn(
            "sticky top-[3.75rem] rounded-3xl border border-black/12 bg-sidebar/90 shadow-sm transition-[padding] duration-300",
            collapsed ? "p-2 flex flex-col items-center gap-2" : "p-4"
          )}
        >
          {showSidebarIntro ? (
            collapsed ? (
              <Link
                href="/customer-space"
                title="미용실 소개"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  normalizedPathname === "/customer-space"
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/customer-space"
                className={cn(
                  "block rounded-2xl border p-4 transition-colors",
                  normalizedPathname === "/customer-space"
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card hover:border-primary hover:bg-accent"
                )}
              >
                <p
                  className={cn(
                    "text-xs font-medium uppercase tracking-[0.16em]",
                    normalizedPathname === "/customer-space"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  BeautyBook
                </p>
                <h2
                  className={cn(
                    "mt-3 text-xl font-semibold tracking-tight",
                    normalizedPathname === "/customer-space"
                      ? "text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  미용실 소개
                </h2>
                <p
                  className={cn(
                    "mt-2 text-sm leading-6",
                    normalizedPathname === "/customer-space"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  매장 분위기와 시술 정보를 보고 예약을 시작합니다.
                </p>
              </Link>
            )
          ) : null}

          {collapsed && <div className="h-px w-8 bg-black/8" />}

          <nav
            className={cn(
              "flex flex-col",
              collapsed ? "items-center gap-2 w-full" : "w-full gap-2.5",
              showSidebarIntro ? "mt-4" : "mt-0",
              collapsed && "mt-0"
            )}
          >
            {customerNavItems.map(({ href, label, description: desc, icon: Icon }) => {
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
                    "relative flex shrink-0 items-center overflow-hidden border transition-all duration-300 ease-in-out",
                    collapsed
                      ? cn(
                          "h-10 w-10 justify-center rounded-xl",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border bg-card text-muted-foreground hover:border-primary hover:bg-accent hover:text-foreground"
                        )
                      : cn(
                          "w-full rounded-2xl px-3 py-3",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border bg-card hover:border-primary hover:bg-accent"
                        )
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 inline-flex rounded-xl transition-all duration-300",
                      collapsed
                        ? "p-0"
                        : cn(
                            "p-2",
                            active
                              ? "bg-primary-foreground/15 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div
                    className={cn(
                      "overflow-hidden transition-all ease-in-out",
                      collapsed
                        ? "w-0 opacity-0 duration-[100ms]"
                        : "w-full opacity-100 duration-200 delay-[160ms] ml-3"
                    )}
                  >
                    <p
                      className={cn(
                        "whitespace-nowrap text-sm font-semibold",
                        active ? "text-primary-foreground" : "text-foreground"
                      )}
                    >
                      {label}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 whitespace-nowrap text-xs",
                        active ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {collapsed && <div className="h-px w-8 bg-black/8" />}

          <button
            onClick={() => collapse(!collapsed)}
            title={collapsed ? "메뉴 펼치기" : undefined}
            className={cn(
              "shrink-0 flex items-center overflow-hidden border border-black/10 bg-background/60 text-xs text-muted-foreground transition-all duration-300 ease-in-out hover:border-black/20 hover:bg-accent",
              collapsed
                ? "h-10 w-10 justify-center rounded-xl"
                : "mt-3 w-full rounded-2xl px-3 py-2.5"
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

      <section className="min-w-0 flex-1 space-y-5">
        {showHeader ? (
          <header className="rounded-3xl border border-black/10 bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
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
              {action ? <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div> : null}
            </div>
          </header>
        ) : null}

        <div className={cn("grid gap-5", aside ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1")}>
          <div className="min-w-0">{children}</div>
          {aside ? (
            <div className="min-w-0">
              <div className="xl:sticky xl:top-[3.75rem]">{aside}</div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
