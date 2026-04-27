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
import { reservationSlotApi } from "@/entities/reservation/api/reservationSlotApi";
import type { ReservationSlot, ReservationSlotStatus } from "@/entities/reservation/model/types";

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
              <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted/50" />
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
                  className="relative aspect-[3/4] w-full bg-muted flex items-center justify-center overflow-hidden text-left"
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
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-7 py-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Designer Profile
            </p>
            <h2 className="mt-0.5 text-xl font-semibold text-foreground">{designer.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
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
                  services={availableServices}
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
  services,
  isLoading,
}: {
  designer: Staff;
  services: BeautyService[];
  isLoading: boolean;
}) {
  const [date, setDate] = useState(() => formatKoreaDate(new Date()));
  const baseService = services[0] ?? null;

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["designer-reservation-slots", designer.id, baseService?.id, date],
    queryFn: () =>
      reservationSlotApi.list({
        beautyServiceIds: [baseService!.id],
        date,
        staffId: designer.id,
      }),
    enabled: !isLoading && baseService != null,
  });

  if (isLoading) {
    return (
      <div className="h-full space-y-2 overflow-y-auto pr-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
    );
  }

  if (!baseService) {
    return (
      <div className="rounded-2xl border border-border bg-background p-5 text-sm text-muted-foreground">
        예약 가능한 시술이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {baseService.name} 기준
        </p>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="h-9 rounded-full border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {slotsLoading ? (
          Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-muted/60" />
          ))
        ) : slots.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background p-5 text-center text-sm text-muted-foreground sm:col-span-2">
            해당 날짜에 표시할 예약 시간이 없습니다.
          </div>
        ) : (
          slots.map((slot) => (
            <ReservationSlotRow key={slot.slotId} slot={slot} />
          ))
        )}
      </div>
    </div>
  );
}

function ReservationSlotRow({ slot }: { slot: ReservationSlot }) {
  const meta = SLOT_STATUS_META[slot.status];
  const timeRange = formatSlotWindow(slot);
  const treatmentRange = formatTreatmentWindow(slot);
  const multiCell = slot.occupiedUnitCount > 1;

  return (
    <article className={`rounded-2xl border p-4 text-left ${meta.className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{formatDateLabelFromIso(slot.startAt)}</p>
          <h3 className="mt-1 text-base font-semibold text-foreground">{timeRange}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            시술 예상 {treatmentRange}
          </p>
          {multiCell ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              약 {slot.durationMinutes}분 · {slot.occupiedUnitCount}칸 사용
            </p>
          ) : null}
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${meta.badgeClassName}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-3 space-y-1">
        {slot.status === "BLOCKED" && slot.reason ? (
          <p className="text-sm text-muted-foreground">{compactBlockReason(slot.reason)}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        )}
      </div>

      <div className={`mt-3 grid gap-1 ${slot.occupiedUnitCount > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
        {Array.from({ length: Math.max(slot.occupiedUnitCount, 1) }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full ${slot.selectable ? "bg-emerald-300" : "bg-muted"}`}
          />
        ))}
      </div>

      {slot.availableStaff.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {slot.availableStaff.length}명 가능 · {slot.occupiedUnitCount}칸 점유
        </p>
      ) : null}
    </article>
  );
}

const SLOT_STATUS_META: Record<
  ReservationSlotStatus,
  { label: string; description: string; className: string; badgeClassName: string }
> = {
  AVAILABLE: {
    label: "예약 요청 가능",
    description: "선택 후 승인 요청을 보낼 수 있습니다.",
    className: "border-black/12 bg-background hover:bg-accent",
    badgeClassName: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  REQUESTED: {
    label: "요청 중",
    description: "다른 고객이 승인 대기 중이에요.",
    className: "border-amber-200 bg-amber-50/60 text-muted-foreground",
    badgeClassName: "bg-amber-100 text-amber-800",
  },
  RESERVED: {
    label: "예약됨",
    description: "이미 예약된 시간이에요.",
    className: "border-black/10 bg-muted/40 text-muted-foreground",
    badgeClassName: "bg-muted text-muted-foreground",
  },
  BLOCKED: {
    label: "예약 불가",
    description: "이 시간엔 예약이 어려워요.",
    className: "border-black/10 bg-muted/30 text-muted-foreground",
    badgeClassName: "bg-muted text-muted-foreground",
  },
  PAST: {
    label: "지난 시간",
    description: "지나간 시간이에요.",
    className: "border-black/6 bg-muted/20 text-muted-foreground/50 opacity-50",
    badgeClassName: "bg-muted/60 text-muted-foreground/60",
  },
};

function formatKoreaDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateLabelFromIso(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatSlotWindow(slot: ReservationSlot) {
  const start = new Date(slot.startAt);
  const end = new Date(start.getTime() + slot.unitMinutes * 60 * 1000);
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Seoul",
  });
  return `${formatter.format(start)} ~ ${formatter.format(end)}`;
}

function formatTreatmentWindow(slot: ReservationSlot) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Seoul",
  });
  return `${formatter.format(new Date(slot.startAt))} ~ ${formatter.format(new Date(slot.endAt))}`;
}

function compactBlockReason(reason: string) {
  return reason.split(" · ")[0] || reason;
}
