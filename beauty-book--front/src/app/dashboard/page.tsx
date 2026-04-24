"use client";

import Link from "next/link";
import {
  CalendarRange,
  ChartNoAxesColumn,
  Clock3,
  Scissors,
  Users,
} from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { useAuth } from "@/entities/user/model/authStore";

const stats = [
  { label: "오늘 예약", value: "12", hint: "실데이터 연결 전 예시 수치" },
  { label: "취소 대기", value: "2", hint: "취소/변경 요청 확인 영역" },
  { label: "근무 직원", value: "5", hint: "직원 스케줄 연결 예정" },
  { label: "신규 고객", value: "3", hint: "고객 관리 기능 연결 예정" },
];

const quickLinks = [
  {
    href: "/booking",
    title: "예약 홈 윤곽 보기",
    description: "고객 로그인 후 진입할 예약 홈 초안 화면입니다.",
    icon: CalendarRange,
  },
  {
    href: "/users",
    title: "사용자 관리",
    description: "현재 운영 중인 계정과 역할을 바로 확인합니다.",
    icon: Users,
  },
  {
    href: "/site-settings",
    title: "메인 관리",
    description: "메인 소개 영역과 전역 설정을 수정합니다.",
    icon: ChartNoAxesColumn,
  },
];

const pipeline = [
  "예약 엔티티와 상태 정의",
  "직원 / 고객 / 서비스 마스터 데이터 추가",
  "예약 관리 페이지와 시간 계산 로직 연결",
];

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  const { user } = useAuth();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex w-fit rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              Admin Dashboard Draft
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {user?.username ?? "운영자"}님, 오늘 운영 상황을 먼저 보는 화면입니다.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                지금은 예약 기능 본구현 전 단계라 실제 수치 대신 구조 윤곽만 보여줍니다.
                이후 예약, 고객, 직원, 서비스 데이터가 연결되면 이 대시보드가 운영 메인 화면이 됩니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              고객 예약 홈 보기
            </Link>
            <Link
              href="/menu-management"
              className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              메뉴 관리
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock3 className="h-4 w-4" />
            빠른 이동
          </div>
          <div className="mt-4 grid gap-3">
            {quickLinks.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-border/60 bg-background px-4 py-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-medium text-foreground">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Scissors className="h-4 w-4" />
            다음 구현 순서
          </div>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            {pipeline.map((item, index) => (
              <li
                key={item}
                className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3"
              >
                {index + 1}. {item}
              </li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}
