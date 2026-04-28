"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronLeft, ChevronRight, Scissors, Search, X } from "lucide-react";
import type { BeautyService } from "@/entities/beauty-service/model/types";
import type { ReservationSlot, ReservationSlotStatus } from "@/entities/reservation/model/types";
import { useReservationSlots } from "@/entities/reservation/model/useReservationSlots";
import { useBusinessHours } from "@/entities/schedule/model/useBusinessHours";
import { staffApi } from "@/entities/staff/api/staffApi";

// ── Step labels ───────────────────────────────────────────────

const DF_STEPS = ["시술 선택", "날짜·시간 선택", "예약 요청"] as const;

// ── Slot status ───────────────────────────────────────────────

const slotStatusMeta: Record<
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

// ── Date/time helpers ─────────────────────────────────────────

function formatDateInput(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateLabel(dateStr: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(dateStr + "T00:00:00"));
}

function formatDateLabelFromIso(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

function formatSlotWindow(slot: ReservationSlot) {
  const start = new Date(slot.startAt);
  const end = new Date(start.getTime() + slot.unitMinutes * 60 * 1000);
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Seoul",
  });
  return `${fmt.format(start)} ~ ${fmt.format(end)}`;
}

function compactBlockReason(reason: string) {
  return reason.split(" · ")[0] || reason;
}

// ── Types ─────────────────────────────────────────────────────

export type DesignerFirstSubmitParams = {
  phone: string;
  serviceIds: number[];
  staffId: number;
  startAt: string;
  endAt: string;
};

// ── Main component ────────────────────────────────────────────

export function DesignerFirstBookingDialog({
  open,
  onClose,
  designer,
  services,
  categoryOptions,
  dateOptions,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  designer: { id: number; name: string; profileImageUrl?: string | null };
  services: BeautyService[];
  categoryOptions: { id: number; name: string; displayOrder: number }[];
  dateOptions: { value: string; shortLabel: string; label: string }[];
  onSubmit: (params: DesignerFirstSubmitParams) => void;
  isPending: boolean;
}) {
  const [dialogStep, setDialogStep] = useState(0);
  const [catFilter, setCatFilter] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => formatDateInput(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<{
    startAt: string;
    endAt: string;
    label: string;
    notice: string | null;
  } | null>(null);

  // Reset all local state when dialog opens
  useEffect(() => {
    if (!open) return;
    setDialogStep(0);
    setQuery("");
    setCatFilter("all");
    setPhoneInput("");
    setSelectedServiceIds([]);
    setSelectedDate(dateOptions[0]?.value ?? formatDateInput(new Date()));
    setSelectedSlot(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 이 디자이너가 진행할 수 있는 시술 ID 목록 (캐시 공유: DesignerDetailDialog와 동일 queryKey)
  const { data: designerServiceIds } = useQuery({
    queryKey: ["designer-available-services", designer.id],
    queryFn: async () => {
      const results = await Promise.all(
        services.map(async (service) => {
          const staffList = await staffApi.list({ beautyServiceId: service.id });
          return { serviceId: service.id, canDo: staffList.some((s) => s.id === designer.id) };
        })
      );
      return new Set(results.filter((r) => r.canDo).map((r) => r.serviceId));
    },
    enabled: services.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: slots = [], isLoading: slotsLoading, isError: slotsError } = useReservationSlots({
    beautyServiceIds: selectedServiceIds,
    date: selectedDate,
    staffId: designer.id,
  });

  const { data: businessHours = [] } = useBusinessHours();

  const isSelectedDateClosed = useMemo(() => {
    if (!selectedDate || businessHours.length === 0) return false;
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
    const dow = dayNames[new Date(selectedDate + "T00:00:00").getDay()];
    const bh = businessHours.find((h) => h.dayOfWeek === dow);
    return bh?.closed ?? false;
  }, [selectedDate, businessHours]);

  const selectedServices = useMemo(
    () => selectedServiceIds.map((id) => services.find((s) => s.id === id)).filter(Boolean) as BeautyService[],
    [selectedServiceIds, services]
  );
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price ?? 0), 0);

  // 디자이너가 할 수 있는 시술만 표시 (designerServiceIds 로드 전엔 전체 표시)
  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = designerServiceIds
      ? services.filter((s) => designerServiceIds.has(s.id))
      : services;
    return base.filter((s) => {
      if (catFilter !== "all" && s.category?.id !== catFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q);
    });
  }, [services, designerServiceIds, query, catFilter]);

  function toggleService(id: number) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSelectedSlot(null);
  }

  function handleSlotClick(slot: ReservationSlot) {
    setSelectedSlot({
      startAt: slot.startAt,
      endAt: slot.endAt,
      label: `${formatDateLabel(selectedDate)} · ${formatSlotWindow(slot)}`,
      notice: slot.notice,
    });
  }

  function handleDateSelect(value: string) {
    setSelectedDate(value);
    setSelectedSlot(null);
  }

  function handleClose() {
    setDialogStep(0);
    onClose();
  }

  const effectiveStep = dialogStep === 1 && selectedSlot ? 2 : dialogStep;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex h-[92vh] flex-col overflow-hidden rounded-t-md bg-background shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:rounded-md">
          <Dialog.Title className="sr-only">{designer.name} 디자이너 예약</Dialog.Title>

          {/* 헤더 */}
          <div className="shrink-0 px-5 pt-5 pb-4 border-b border-black/8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                  {designer.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={designer.profileImageUrl} alt={designer.name} className="h-9 w-9 object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-foreground">{designer.name[0]}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{designer.name} 디자이너 예약</h2>
                  <p className="text-xs text-muted-foreground">
                    {DF_STEPS[Math.min(effectiveStep, DF_STEPS.length - 1)]}
                  </p>
                </div>
              </div>
              <Dialog.Close onClick={handleClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </Dialog.Close>
            </div>

            {/* 스텝 진행 바 */}
            <div className="flex items-center gap-1.5">
              {DF_STEPS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => i < dialogStep && setDialogStep(i)}
                  className="flex-1 group"
                >
                  <div
                    className={`h-1.5 rounded-md transition-all duration-300 ${
                      i < effectiveStep
                        ? "bg-primary cursor-pointer group-hover:bg-primary/70"
                        : i === effectiveStep
                          ? "bg-primary"
                          : "bg-muted"
                    }`}
                  />
                  <p
                    className={`mt-1 text-center text-[10px] font-medium transition-colors ${
                      i <= effectiveStep ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 슬라이드 본문 */}
          <div className="relative flex-1 overflow-hidden">
            {/* ── 슬라이드 0: 시술 선택 ── */}
            <div
              className="absolute inset-0 overflow-y-auto p-5 transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(${(0 - dialogStep) * 100}%)` }}
            >
              {categoryOptions.length > 0 && (() => {
                const visibleCategoryIds = new Set(filteredServices.map((s) => s.category?.id).filter(Boolean));
                const visibleCategories = categoryOptions.filter((c) => visibleCategoryIds.has(c.id));
                if (visibleCategories.length === 0) return null;
                return (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <DFCategoryChip label="전체" active={catFilter === "all"} onClick={() => setCatFilter("all")} />
                    {visibleCategories.map((c) => (
                      <DFCategoryChip
                        key={c.id}
                        label={c.name}
                        active={catFilter === c.id}
                        onClick={() => setCatFilter(c.id)}
                      />
                    ))}
                  </div>
                );
              })()}
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="시술 검색..."
                  className="w-full rounded-md border border-black/10 bg-muted/30 py-2 pl-8 pr-4 text-sm outline-none focus:border-black/25"
                />
              </div>
              <div className="grid gap-3 grid-cols-2">
                {filteredServices.map((service) => {
                  const idx = selectedServiceIds.indexOf(service.id);
                  const role = idx === -1 ? "none" : idx === 0 ? "main" : "option";
                  return (
                    <DFServiceCard
                      key={service.id}
                      service={service}
                      role={role}
                      optionOrder={idx > 0 ? idx : null}
                      onClick={() => toggleService(service.id)}
                    />
                  );
                })}
                {filteredServices.length === 0 && (
                  <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                    검색 결과가 없습니다.
                  </p>
                )}
              </div>
            </div>

            {/* ── 슬라이드 1: 날짜·시간 선택 ── */}
            <div
              className="absolute inset-0 overflow-y-auto p-5 transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(${(1 - dialogStep) * 100}%)` }}
            >
              <div className="mb-4 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleDateSelect(opt.value)}
                    className={`rounded-md border px-1.5 py-2 text-center transition-colors ${
                      selectedDate === opt.value
                        ? "border-black/25 bg-primary text-primary-foreground"
                        : "border-black/10 bg-background hover:bg-accent"
                    }`}
                  >
                    <span className="block text-xs font-medium">{opt.shortLabel}</span>
                    <span className="mt-0.5 block text-[11px] opacity-70">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {selectedServiceIds.length === 0 ? (
                  <p className="col-span-2 py-6 text-center text-sm text-muted-foreground">
                    시술을 먼저 선택해주세요.
                  </p>
                ) : slotsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-md bg-muted/50" />
                  ))
                ) : slotsError ? (
                  <p className="col-span-2 text-sm text-muted-foreground">시간을 불러오지 못했습니다.</p>
                ) : slots.length === 0 ? (
                  <p className="col-span-2 py-6 text-center text-sm text-muted-foreground">
                    {isSelectedDateClosed
                      ? "휴무일입니다. 다른 날짜를 선택해주세요."
                      : "예약 가능한 시간이 없습니다."}
                  </p>
                ) : (
                  slots.map((slot) => (
                    <DFSlotCard
                      key={slot.slotId}
                      slot={slot}
                      selected={selectedSlot?.startAt === slot.startAt}
                      onClick={() => handleSlotClick(slot)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="shrink-0 border-t border-black/8 px-5 py-3">
            {dialogStep === 1 && selectedSlot ? (
              /* 슬롯 선택됨 → 전화번호 입력 + 예약 요청 */
              <div className="flex flex-col gap-2">
                <div className="min-w-0 flex flex-col gap-0.5">
                  <p className="truncate text-xs font-medium text-foreground">
                    {selectedServices.map((s) => s.name).join(", ")}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{designer.name}</span>
                    <span>·</span>
                    <span className="truncate">{selectedSlot.label}</span>
                    <span>·</span>
                    <span className="shrink-0">
                      {totalDuration}분 / {totalPrice.toLocaleString()}원
                    </span>
                  </div>
                </div>
                {selectedSlot.notice && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                    {selectedSlot.notice}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(null)}
                    className="inline-flex items-center gap-1 shrink-0 rounded-md border border-black/15 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <input
                    type="tel"
                    placeholder="연락처 (010-0000-0000)"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="flex-1 rounded-md border border-black/15 bg-muted/30 px-4 py-2 text-sm outline-none focus:border-black/30"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onSubmit({
                        phone: phoneInput,
                        serviceIds: selectedServiceIds,
                        staffId: designer.id,
                        startAt: selectedSlot.startAt,
                        endAt: selectedSlot.endAt,
                      })
                    }
                    disabled={isPending || !phoneInput.trim()}
                    className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-primary/90"
                  >
                    {isPending ? "요청 중..." : "예약 요청"}
                  </button>
                </div>
              </div>
            ) : dialogStep === 0 ? (
              /* 스텝 0 내비게이션 */
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  닫기
                </button>
                <div className="flex items-center gap-1.5">
                  {DF_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-md transition-all duration-300 ${
                        i === dialogStep ? "w-5 bg-primary" : i < dialogStep ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setDialogStep(1)}
                  disabled={selectedServiceIds.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {selectedServiceIds.length > 0
                    ? `다음 (${selectedServiceIds.length}개 선택됨)`
                    : "다음"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* 스텝 1, 슬롯 미선택 → 이전 + 안내 */
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDialogStep(0)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </button>
                <p className="text-xs text-muted-foreground">날짜와 시간을 선택해주세요.</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Sub-components ────────────────────────────────────────────

function DFCategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-foreground text-background"
          : "border border-black/10 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function DFServiceCard({
  service,
  role,
  optionOrder,
  onClick,
}: {
  service: BeautyService;
  role: "none" | "main" | "option";
  optionOrder: number | null;
  onClick: () => void;
}) {
  const selected = role !== "none";
  const ringClass =
    role === "main"
      ? "border-primary bg-background shadow-[0_12px_28px_rgba(17,24,39,0.14)] ring-2 ring-primary/20"
      : role === "option"
        ? "border-primary/70 bg-background shadow-sm ring-2 ring-primary/10"
        : "border-black/10 bg-background hover:border-black/20 hover:bg-accent";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-md border text-left transition-all active:scale-[0.98] ${ringClass}`}
    >
      {selected && <span className="absolute inset-y-0 left-0 z-20 w-1 bg-primary" />}
      {selected && (
        <span
          className={`absolute left-2 top-2 z-30 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-lg ${
            role === "main"
              ? "bg-primary text-primary-foreground"
              : "bg-white/95 text-primary ring-1 ring-primary/40"
          }`}
        >
          <Check className="h-3 w-3" />
          {role === "main" ? "메인" : `옵션 ${optionOrder}`}
        </span>
      )}
      {service.imageUrls?.[0] ? (
        <div
          className="aspect-[16/9] bg-cover bg-center"
          style={{ backgroundImage: `url(${service.imageUrls[0]})` }}
        />
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-muted/60 to-background">
          <Scissors className="h-5 w-5 text-muted-foreground/20" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-snug">{service.name}</h3>
          <span
            className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold mt-0.5 ${
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/15"
                : "border-black/15 bg-background text-transparent"
            }`}
            aria-hidden
          >
            ✓
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {service.durationMinutes}분 · {Number(service.price).toLocaleString()}원
        </p>
      </div>
    </button>
  );
}

function DFSlotCard({
  slot,
  selected,
  onClick,
}: {
  slot: ReservationSlot;
  selected: boolean;
  onClick: () => void;
}) {
  const disabled = !slot.selectable;
  const meta = slotStatusMeta[slot.status];
  const timeRange = formatSlotWindow(slot);
  const multiCell = slot.occupiedUnitCount > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-md border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed ${
        selected ? "border-primary bg-background shadow-[0_12px_28px_rgba(17,24,39,0.12)] ring-2 ring-primary/20" : meta.className
      }`}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-1 bg-primary" />}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{formatDateLabelFromIso(slot.startAt)}</p>
          <h3 className="mt-1 text-base font-semibold text-foreground">{timeRange}</h3>
          {multiCell && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              약 {slot.durationMinutes}분 · {slot.occupiedUnitCount}칸 사용
            </p>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 rounded-md px-2 py-1 text-xs font-medium ${
            selected ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20" : meta.badgeClassName
          }`}
        >
          {selected ? (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3 w-3" />
              선택됨
            </span>
          ) : meta.label}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        {slot.selectable ? (
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        ) : slot.status === "BLOCKED" ? (
          <p className="text-sm text-muted-foreground">{compactBlockReason(slot.reason)}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        )}
      </div>
      <div className={`mt-3 grid gap-1 ${slot.occupiedUnitCount > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
        {Array.from({ length: Math.max(slot.occupiedUnitCount, 1) }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-md ${
              selected ? "bg-primary" : slot.selectable ? "bg-emerald-300" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </button>
  );
}
