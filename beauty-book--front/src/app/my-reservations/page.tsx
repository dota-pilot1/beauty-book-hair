"use client";

import { CalendarClock, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";

const reservations = [
  {
    status: "승인 대기",
    tone: "text-amber-600 bg-amber-500/10",
    service: "레이어드 컷 + 드라이",
    designer: "수아 디자이너",
    schedule: "4월 29일 화요일 · 오후 2:00",
  },
  {
    status: "예약 확정",
    tone: "text-emerald-600 bg-emerald-500/10",
    service: "뿌리 염색",
    designer: "민서 디자이너",
    schedule: "5월 2일 금요일 · 오전 11:30",
  },
  {
    status: "취소 완료",
    tone: "text-rose-600 bg-rose-500/10",
    service: "클리닉",
    designer: "유나 디자이너",
    schedule: "지난 예약 예시",
  },
];

export default function MyReservationsPage() {
  return (
    <RequireAuth>
      <CustomerShell
        eyebrow="My Reservations"
        title="내 예약 상태를 한눈에 확인합니다."
        description="승인 대기, 예약 확정, 취소 상태를 빠르게 확인하고 필요한 경우 변경 또는 취소 요청으로 이어질 수 있게 구성합니다."
      >
        <div className="space-y-4">
          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: "승인 대기", value: "1", icon: Clock3 },
              { label: "예약 확정", value: "1", icon: CheckCircle2 },
              { label: "취소 완료", value: "1", icon: XCircle },
            ].map(({ label, value, icon: Icon }) => (
              <article key={label} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarClock className="h-4 w-4" />
              예약 목록 초안
            </div>
            <div className="mt-4 space-y-3">
              {reservations.map((item) => (
                <article key={`${item.status}-${item.service}`} className="rounded-2xl border border-border/60 bg-background p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.tone}`}>
                        {item.status}
                      </span>
                      <h2 className="mt-3 text-lg font-medium text-foreground">{item.service}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{item.designer}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.schedule}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
                        상세 보기
                      </button>
                      <button type="button" className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
                        변경 요청
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
