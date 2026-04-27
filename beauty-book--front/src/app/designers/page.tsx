"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, LayoutGrid, LayoutList, UserRound, X } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { staffApi } from "@/entities/staff/api/staffApi";
import type { Staff } from "@/entities/staff/model/types";
import { beautyServiceApi } from "@/entities/beauty-service/api/beautyServiceApi";
import type { BeautyService } from "@/entities/beauty-service/model/types";

export default function DesignersPage() {
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [selectedDesigner, setSelectedDesigner] = useState<Staff | null>(null);

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["staff-public"],
    queryFn: () => staffApi.list(),
  });

  const designers = staffList.filter((s) => s.role === "DESIGNER" && s.active);

  const toggle = (
    <div className="flex h-8 items-stretch rounded-md border border-border overflow-hidden">
      <button
        onClick={() => setViewMode("list")}
        className={`flex items-center px-2.5 transition-colors ${
          viewMode === "list"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:bg-muted"
        }`}
        title="목록 뷰"
      >
        <LayoutList className="h-4 w-4" />
      </button>
      <div className="w-px bg-border" />
      <button
        onClick={() => setViewMode("card")}
        className={`flex items-center px-2.5 transition-colors ${
          viewMode === "card"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:bg-muted"
        }`}
        title="카드 뷰"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <RequireAuth>
      <CustomerShell
        eyebrow="Designers"
        title="디자이너 선택이 필요한 예약 흐름을 위한 공간입니다."
        description="디자이너 선택이 필요한 서비스라면 전문 분야와 가장 빠른 가능 시간을 함께 보여주는 구조가 가장 실용적입니다."
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "불러오는 중..." : `총 ${designers.length}명`}
          </p>
          {toggle}
        </div>

        {isLoading ? (
          <div className={viewMode === "card" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : designers.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">등록된 디자이너가 없습니다.</p>
        ) : viewMode === "list" ? (
          <section className="space-y-4">
            {designers.map((designer) => (
              <article key={designer.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {designer.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={designer.profileImageUrl} alt={designer.name} className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{designer.name}</h2>
                      {designer.introduction && (
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <BadgeCheck className="h-4 w-4 shrink-0" />
                          {designer.introduction}
                        </p>
                      )}
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        예약 가능 여부는 예약 페이지에서 확인하세요
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDesigner(designer)}
                      className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                    >
                      상세 보기
                    </button>
                    <Link
                      href="/booking"
                      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      이 디자이너로 예약하기
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {designers.map((designer) => (
              <article key={designer.id} className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                <button
                  type="button"
                  onClick={() => setSelectedDesigner(designer)}
                  className="h-48 bg-muted flex items-center justify-center overflow-hidden text-left"
                  aria-label={`${designer.name} 상세 보기`}
                >
                  {designer.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={designer.profileImageUrl} alt={designer.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="inline-flex rounded-full bg-background p-5 shadow-sm">
                      <UserRound className="h-10 w-10 text-muted-foreground" />
                    </span>
                  )}
                </button>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h2 className="text-base font-semibold">{designer.name}</h2>
                  {designer.introduction && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="h-4 w-4 shrink-0" />
                      {designer.introduction}
                    </p>
                  )}
                  <div className="mt-auto grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDesigner(designer)}
                      className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                    >
                      상세 보기
                    </button>
                    <Link
                      href="/booking"
                      className="rounded-full bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      예약하기
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {selectedDesigner ? (
          <DesignerDetailDialog
            designer={selectedDesigner}
            onClose={() => setSelectedDesigner(null)}
          />
        ) : null}
      </CustomerShell>
    </RequireAuth>
  );
}

function DesignerDetailDialog({
  designer,
  onClose,
}: {
  designer: Staff;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"services" | "status">("services");
  const { data: availableServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["designer-available-services", designer.id],
    queryFn: async () => {
      const services = await beautyServiceApi.list({ visible: true });
      const pairs = await Promise.all(
        services.map(async (service) => {
          const availableDesigners = await staffApi.list({ beautyServiceId: service.id });
          return { service, available: availableDesigners.some((staff) => staff.id === designer.id) };
        })
      );
      return pairs
        .filter((pair) => pair.available)
        .map((pair) => pair.service)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8">
      <div className="flex h-[760px] max-h-[calc(100vh-96px)] w-[calc(100vw-96px)] max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex h-24 shrink-0 items-center justify-between border-b border-border px-7 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Designer Profile
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">{designer.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[460px_minmax(0,1fr)]">
          <div className="min-h-0 bg-muted p-4">
            {designer.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={designer.profileImageUrl}
                alt={designer.name}
                className="h-full w-full rounded-xl bg-background object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-background">
                <span className="inline-flex rounded-full bg-background p-6 shadow-sm">
                  <UserRound className="h-12 w-12 text-muted-foreground" />
                </span>
              </div>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col gap-5 p-7">
            <section>
              <h3 className="text-sm font-semibold text-foreground">소개</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {designer.introduction ?? "등록된 소개 문구가 없습니다."}
              </p>
            </section>

            <div className="flex w-fit rounded-full border border-border bg-background p-1">
              <TabButton active={tab === "services"} onClick={() => setTab("services")}>
                가능한 시술
              </TabButton>
              <TabButton active={tab === "status"} onClick={() => setTab("status")}>
                예약 상태
              </TabButton>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {tab === "services" ? (
                <DesignerServicesPanel services={availableServices} isLoading={servicesLoading} />
              ) : (
                <DesignerReservationStatusPanel
                  designer={designer}
                  serviceCount={availableServices.length}
                  isLoading={servicesLoading}
                />
              )}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border pt-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                닫기
              </button>
              <Link
                href="/booking"
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                이 디자이너로 예약하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function DesignerServicesPanel({
  services,
  isLoading,
}: {
  services: BeautyService[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="h-full space-y-3 overflow-y-auto pr-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-background p-5 text-sm text-muted-foreground">
        연결된 시술 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="h-full space-y-3 overflow-y-auto pr-1">
      {services.map((service) => (
        <article key={service.id} className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{service.category.name}</p>
              <h3 className="mt-1 text-sm font-semibold text-foreground">{service.name}</h3>
              {service.description ? (
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {service.description}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-foreground">
                {Number(service.price).toLocaleString()}원
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{service.durationMinutes}분</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function DesignerReservationStatusPanel({
  designer,
  serviceCount,
  isLoading,
}: {
  designer: Staff;
  serviceCount: number;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <BadgeCheck className="h-4 w-4 text-primary" />
          프로필 상태
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {designer.active ? "예약 가능한 디자이너입니다." : "현재 비활성 상태입니다."}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          예약 가능 범위
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {isLoading ? "시술 연결 정보를 확인 중입니다." : `${serviceCount}개 시술 기준으로 예약을 진행할 수 있습니다.`}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2">
        <h3 className="text-sm font-medium text-foreground">시간 확인</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          실제 가능한 날짜와 시간은 예약 페이지에서 시술을 선택한 뒤 확인됩니다.
          같은 디자이너라도 시술 시간에 따라 가능한 슬롯이 달라질 수 있습니다.
        </p>
      </div>
    </div>
  );
}
