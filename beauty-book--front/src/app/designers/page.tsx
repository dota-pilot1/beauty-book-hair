"use client";

import { BadgeCheck, CalendarDays, UserRound } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";

const designers = [
  { name: "수아 디자이너", specialty: "레이어드 컷, 자연스러운 펌", next: "오늘 오후 4:30 가능" },
  { name: "민서 디자이너", specialty: "톤다운 컬러, 뿌리 염색", next: "내일 오전 11:00 가능" },
  { name: "유나 디자이너", specialty: "클리닉, 두피 케어", next: "목요일 오후 1:30 가능" },
];

export default function DesignersPage() {
  return (
    <RequireAuth>
      <CustomerShell
        eyebrow="Designers"
        title="디자이너 선택이 필요한 예약 흐름을 위한 공간입니다."
        description="디자이너 선택이 필요한 서비스라면 전문 분야와 가장 빠른 가능 시간을 함께 보여주는 구조가 가장 실용적입니다."
      >
        <section className="space-y-4">
          {designers.map((designer) => (
            <article key={designer.name} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <span className="inline-flex rounded-2xl bg-muted p-3 text-foreground">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">{designer.name}</h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="h-4 w-4" />
                      {designer.specialty}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {designer.next}
                    </p>
                  </div>
                </div>
                <button type="button" className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
                  이 디자이너로 예약하기
                </button>
              </div>
            </article>
          ))}
        </section>
      </CustomerShell>
    </RequireAuth>
  );
}
