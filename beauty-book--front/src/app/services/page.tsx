"use client";

import { Clock3, Scissors, WalletCards } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";

const services = [
  { name: "레이어드 컷", duration: "60분", price: "55,000원" },
  { name: "뿌리 염색", duration: "90분", price: "88,000원" },
  { name: "클리닉", duration: "50분", price: "70,000원" },
];

export default function ServicesPage() {
  return (
    <RequireAuth>
      <CustomerShell
        eyebrow="Services"
        title="예약 전에 필요한 시술과 가격을 확인합니다."
        description="초기 단계에서는 상세 마케팅 설명보다 예약 결정에 필요한 소요 시간, 예상 가격, 기본 구성을 먼저 보여주는 것이 더 중요합니다."
      >
        <section className="grid gap-4 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.name} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                <Scissors className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{service.name}</h2>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  예상 소요 시간 {service.duration}
                </p>
                <p className="flex items-center gap-2">
                  <WalletCards className="h-4 w-4" />
                  기본 가격 {service.price}
                </p>
              </div>
              <button type="button" className="mt-5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                이 시술로 예약하기
              </button>
            </article>
          ))}
        </section>
      </CustomerShell>
    </RequireAuth>
  );
}
