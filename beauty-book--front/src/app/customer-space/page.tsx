"use client";

import Link from "next/link";
import {
  CalendarCheck2,
  MessageCircleMore,
  Scissors,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";

const quickActions = [
  {
    href: "/booking",
    title: "예약 시작하기",
    description: "시술, 디자이너, 날짜와 시간을 순서대로 선택합니다.",
    icon: CalendarCheck2,
  },
  {
    href: "/my-reservations",
    title: "내 예약 확인",
    description: "승인 대기, 확정, 취소 상태를 바로 확인합니다.",
    icon: Sparkles,
  },
  {
    href: "/services",
    title: "시술/가격 보기",
    description: "예약 전에 필요한 최소 서비스 정보를 확인합니다.",
    icon: Scissors,
  },
  {
    href: "/designers",
    title: "디자이너 보기",
    description: "담당 디자이너의 스타일과 강점을 비교합니다.",
    icon: UserRoundSearch,
  },
];

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
                  “주말 오전 타임이 비면 알려주세요.”
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
          <section className="grid gap-4 md:grid-cols-2">
            {quickActions.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm transition-colors hover:bg-accent"
              >
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </Link>
            ))}
          </section>

          <section className="rounded-2xl border border-black/12 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">미용실 이용 안내</h2>
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
