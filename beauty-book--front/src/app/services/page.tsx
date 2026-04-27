"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Clock3, Images, LayoutGrid, List, Scissors, WalletCards } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { useVisibleBeautyServices } from "@/entities/beauty-service/model/useBeautyServices";
import { cn } from "@/shared/lib/utils";
import { ServiceImageDialog } from "@/shared/ui/ServiceImageDialog";

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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [dialogState, setDialogState] = useState<{ urls: string[]; index: number; alt: string } | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    return services
      .map((s) => s.category)
      .filter((c) => { if (seen.has(c.code)) return false; seen.add(c.code); return true; })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [services]);

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && categories.length > 0) {
      initialized.current = true;
      setSelectedCategory(categories[0].code);
    }
  }, [categories]);

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

      {/* 카테고리 필터 + 뷰 토글 */}
      {!isLoading && !isError && categories.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
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
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-black/10 bg-card p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center justify-center rounded-lg p-1.5 transition-colors",
                viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center justify-center rounded-lg p-1.5 transition-colors",
                viewMode === "table" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 카드 뷰 */}
      {viewMode === "grid" && (
        <section className="grid gap-4 lg:grid-cols-3">
          {filtered.map((service) => {
            const hasImages = (service.imageUrls?.length ?? 0) > 0;
            const multipleImages = (service.imageUrls?.length ?? 0) > 1;
            return (
              <article key={service.id} className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                {hasImages ? (
                  <div
                    className="relative aspect-[16/10] cursor-pointer"
                    onClick={() => setDialogState({ urls: service.imageUrls!, index: 0, alt: service.name })}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${service.imageUrls![0]})` }}
                      aria-label={`${service.name} 이미지`}
                    />
                    {multipleImages && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        <Images className="h-3 w-3" />
                        {service.imageUrls!.length}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/10] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted/50 via-muted/30 to-background border-b border-border/40">
                    <div className="rounded-2xl bg-muted/60 p-4">
                      <Scissors className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <span className="text-xs text-muted-foreground/50">이미지 없음</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{service.name}</h2>
                    <span className="shrink-0 rounded-full border border-black/10 bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                      {service.category.name}
                    </span>
                  </div>
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
            );
          })}
        </section>
      )}

      {/* 테이블 뷰 */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">시술명</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">카테고리</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">소요 시간</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">기본 가격</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((service) => (
                <tr key={service.id} className="group hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {service.imageUrls?.[0] ? (
                        <button
                          type="button"
                          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl"
                          onClick={() => setDialogState({ urls: service.imageUrls!, index: 0, alt: service.name })}
                          aria-label="이미지 보기"
                        >
                          <div
                            className="h-full w-full bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${service.imageUrls[0]})` }}
                          />
                          {(service.imageUrls.length ?? 0) > 1 && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-[9px] font-bold text-white">
                              +{service.imageUrls.length - 1}
                            </span>
                          )}
                        </button>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60">
                          <Scissors className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{service.name}</p>
                        {service.description ? (
                          <p className="line-clamp-1 text-xs text-muted-foreground">{service.description}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-black/10 bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                      {service.category.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {service.durationMinutes}분
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {Number(service.price).toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href="/booking"
                      className="inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      예약하기
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogState && (
        <ServiceImageDialog
          open={true}
          imageUrls={dialogState.urls}
          initialIndex={dialogState.index}
          alt={dialogState.alt}
          onClose={() => setDialogState(null)}
        />
      )}
    </CustomerShell>
  );
}
