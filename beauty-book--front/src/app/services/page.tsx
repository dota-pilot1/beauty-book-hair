"use client";

import { useMemo, useState } from "react";
import { Clock3, Scissors, WalletCards } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { useVisibleBeautyServices } from "@/entities/beauty-service/model/useBeautyServices";

export default function ServicesPage() {
  return (
    <RequireAuth>
      <ServicesContent />
    </RequireAuth>
  );
}

function ServicesContent() {
  const { data: services = [], isLoading, isError } = useVisibleBeautyServices("services-page");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    return services
      .map((s) => s.category)
      .filter((c) => { if (seen.has(c.code)) return false; seen.add(c.code); return true; })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [services]);

  const filtered = selectedCategory
    ? services.filter((s) => s.category.code === selectedCategory)
    : services;

  return (
    <CustomerShell
      eyebrow="Services"
      title="예약 전에 필요한 시술과 가격을 확인합니다."
      description="관리자가 등록한 공개 시술 기준으로 소요 시간, 예상 가격, 기본 구성을 보여줍니다."
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">시술 목록을 불러오는 중...</p>
      ) : null}
      {isError ? (
        <p className="text-sm text-destructive">시술 목록을 불러오지 못했습니다.</p>
      ) : null}
      {!isLoading && !isError && services.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 bg-muted/20 p-6 text-sm text-muted-foreground">
          공개된 시술이 없습니다.
        </p>
      ) : null}

      {/* 카테고리 필터 탭 */}
      {!isLoading && !isError && categories.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === null
                ? "border-black/25 bg-primary text-primary-foreground"
                : "border-black/10 bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.code}
              type="button"
              onClick={() => setSelectedCategory(cat.code)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat.code
                  ? "border-black/25 bg-primary text-primary-foreground"
                  : "border-black/10 bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        {filtered.map((service) => (
          <article key={service.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {service.imageUrls?.[0] ? (
              <div
                className="aspect-[16/10] bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${service.imageUrls[0]})` }}
                aria-label={`${service.name} 이미지`}
              />
            ) : null}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <Scissors className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-black/10 bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                  {service.category.name}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold">{service.name}</h2>
              {service.description ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {service.description}
                </p>
              ) : null}
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  예상 소요 시간 {service.durationMinutes}분
                </p>
                <p className="flex items-center gap-2">
                  <WalletCards className="h-4 w-4" />
                  기본 가격 {Number(service.price).toLocaleString()}원
                </p>
              </div>
              <a
                href="/booking"
                className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                이 시술로 예약하기
              </a>
            </div>
          </article>
        ))}
      </section>
    </CustomerShell>
  );
}
