"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Scissors,
  UserRound,
} from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import type { BeautyService } from "@/entities/beauty-service/model/types";
import { useVisibleBeautyServices } from "@/entities/beauty-service/model/useBeautyServices";
import type { ReservationSlot, ReservationSlotStatus } from "@/entities/reservation/model/types";
import { useReservationSlots } from "@/entities/reservation/model/useReservationSlots";
import type { Staff } from "@/entities/staff/model/types";
import { useStaffByService } from "@/entities/staff/model/useStaff";
import {
  bookingFlowActions,
  type BookingStepKey,
  useBookingFlow,
} from "@/features/booking/model/bookingFlowStore";

const steps: Array<{
  key: BookingStepKey;
  title: string;
  icon: typeof Scissors;
}> = [
  {
    key: "service",
    title: "시술 선택",
    icon: Scissors,
  },
  {
    key: "designer",
    title: "디자이너 선택",
    icon: UserRound,
  },
  {
    key: "schedule",
    title: "날짜/시간 선택",
    icon: Clock3,
  },
];

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
    description: "다른 고객의 승인 대기 예약이 있습니다.",
    className: "border-amber-200 bg-amber-50/60 text-muted-foreground",
    badgeClassName: "bg-amber-100 text-amber-800",
  },
  RESERVED: {
    label: "예약됨",
    description: "이미 확정된 예약 시간입니다.",
    className: "border-black/10 bg-muted/40 text-muted-foreground",
    badgeClassName: "bg-muted text-muted-foreground",
  },
  BLOCKED: {
    label: "예약 불가",
    description: "근무 외 시간 또는 매장 차단 시간입니다.",
    className: "border-black/10 bg-muted/30 text-muted-foreground",
    badgeClassName: "bg-muted text-muted-foreground",
  },
};

export default function BookingPage() {
  return (
    <RequireAuth>
      <BookingFlowPage />
    </RequireAuth>
  );
}

function BookingFlowPage() {
  const {
    hydrated,
    step,
    selectedServiceId,
    selectedDate,
    selectedDesignerId,
    selectedDesigner,
    selectedStartAt,
    selectedEndAt,
    selectedSlot,
    selectedSlotAvailableDesigners,
    selectedOccupiedUnitCount,
  } = useBookingFlow();

  const { data: services = [], isLoading: servicesLoading } = useVisibleBeautyServices("booking");
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedServiceName = selectedService?.name ?? "선택 전";
  const dateOptions = useMemo(() => getNextDateOptions(7), []);

  const { data: staffList = [], isLoading: staffLoading } = useStaffByService(selectedServiceId);

  const {
    data: reservationSlots = [],
    isLoading: slotsLoading,
    isError: slotsError,
  } = useReservationSlots({
    beautyServiceId: selectedServiceId,
    date: selectedDate,
    staffId: selectedDesignerId ?? undefined,
  });

  useEffect(() => {
    bookingFlowActions.hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated || services.length === 0) return;
    const exists = services.some((service) => service.id === selectedServiceId);
    if (!exists) {
      bookingFlowActions.setSelectedServiceId(services[0].id);
    }
  }, [hydrated, services, selectedServiceId]);

  const currentIndex = steps.findIndex((item) => item.key === step);

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      bookingFlowActions.setStep(steps[currentIndex + 1].key);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      bookingFlowActions.setStep(steps[currentIndex - 1].key);
    }
  };

  const selectSlot = (slot: ReservationSlot) => {
    bookingFlowActions.setSelectedSlot({
      label: `${formatDateLabel(selectedDate)} · ${formatTimeRange(slot)}`,
      startAt: slot.startAt,
      endAt: slot.endAt,
      availableStaff: slot.availableStaff,
      occupiedUnitCount: slot.occupiedUnitCount,
    });
  };

  if (!hydrated) return null;

  return (
    <CustomerShell
      eyebrow="Booking Flow"
      title="예약하기"
      description="시술, 디자이너, 날짜와 시간을 순서대로 선택합니다."
      showSidebarIntro={false}
      showHeader={false}
      action={
        <>
          <button
            type="button"
            onClick={() => bookingFlowActions.setStep("service")}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            예약하기
          </button>
          <Link
            href="/my-reservations"
            className="inline-flex items-center justify-center rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            내 예약 보기
          </Link>
        </>
      }
      aside={
        <BookingStatusPanel
          selectedServiceName={selectedServiceName}
          selectedDesigner={selectedDesignerId ? selectedDesigner : null}
          selectedSlot={selectedStartAt ? selectedSlot : null}
          selectedService={selectedService}
          onReset={bookingFlowActions.reset}
        />
      }
    >
        <div className="space-y-4">
          <section className="grid gap-3 xl:grid-cols-3">
          {steps.map(({ key, title, icon: Icon }, index) => {
            const active = step === key;
            const done = index < currentIndex;

            return (
              <button
                key={key}
                type="button"
                onClick={() => bookingFlowActions.setStep(key)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  active
                    ? "border-black/20 bg-primary/10"
                    : "border-black/12 bg-card hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-xl p-2 ${
                      active || done ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {done ? (
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      완료
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {index + 1}단계
                </p>
              </button>
            );
          })}
        </section>

        <section className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm">
          {step === "service" ? (
            <StepSection
              icon={Scissors}
              title="시술 선택"
              description=""
            >
              {servicesLoading ? (
                <p className="text-sm text-muted-foreground">시술 목록을 불러오는 중...</p>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground">등록된 시술이 없습니다. 관리자 화면에서 먼저 시술을 등록해주세요.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {services.map((service) => (
                    <ServiceSelectableCard
                      key={service.id}
                      service={service}
                      selected={selectedServiceId === service.id}
                      onClick={() => bookingFlowActions.setSelectedServiceId(service.id)}
                    />
                  ))}
                </div>
              )}
            </StepSection>
          ) : null}

          {step === "designer" ? (
            <StepSection
              icon={UserRound}
              title="디자이너 선택"
              description={`${selectedServiceName} 시술이 가능한 디자이너를 선택합니다.`}
            >
              {staffLoading ? (
                <p className="text-sm text-muted-foreground">디자이너 목록을 불러오는 중...</p>
              ) : staffList.length === 0 ? (
                <p className="text-sm text-muted-foreground">해당 시술이 가능한 디자이너가 없습니다.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {staffList.map((staff) => (
                    <DesignerCard
                      key={staff.id}
                      staff={staff}
                      selected={selectedDesignerId === staff.id}
                      onClick={() => bookingFlowActions.setSelectedDesigner(staff.id, staff.name)}
                    />
                  ))}
                </div>
              )}
            </StepSection>
          ) : null}

          {step === "schedule" ? (
            <StepSection
              icon={CalendarDays}
              title={selectedDesigner !== "선택 전" ? `${selectedDesigner}의 예약 가능한 시간` : "날짜/시간 선택"}
              description={selectedDesigner !== "선택 전" ? `${selectedServiceName} · ${selectedDesigner}` : "디자이너를 먼저 선택해주세요."}
            >
              {/* 날짜 선택 */}
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => bookingFlowActions.setSelectedDate(option.value)}
                    className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
                      selectedDate === option.value
                        ? "border-black/25 bg-primary text-primary-foreground"
                        : "border-black/10 bg-background hover:bg-accent"
                    }`}
                  >
                    <span className="block text-xs font-medium">{option.shortLabel}</span>
                    <span className="mt-0.5 block text-[11px] opacity-70">{option.label}</span>
                  </button>
                ))}
              </div>

              {/* 슬롯 목록 */}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {slotsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
                  ))
                ) : slotsError ? (
                  <p className="col-span-2 text-sm text-muted-foreground">가능한 시간을 불러오지 못했습니다.</p>
                ) : reservationSlots.length === 0 ? (
                  <p className="col-span-2 text-sm text-muted-foreground">선택한 날짜에 표시할 시간이 없습니다.</p>
                ) : reservationSlots.map((slot) => (
                  <SlotSelectableCard
                    key={slot.slotId}
                    slot={slot}
                    selected={selectedStartAt === slot.startAt}
                    onClick={() => selectSlot(slot)}
                  />
                ))}
              </div>
            </StepSection>
          ) : null}

          <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-5">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전 단계
            </button>
            {currentIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                다음 단계
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!selectedStartAt}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                예약 요청 보내기
              </button>
            )}
          </div>
        </section>

      </div>
    </CustomerShell>
  );
}

function DesignerCard({
  staff,
  selected,
  onClick,
}: {
  staff: Staff;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        selected ? "border-black/25 bg-primary/10" : "border-black/12 bg-background hover:bg-accent"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
          {staff.name[0]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground">{staff.name}</h3>
            {selected && (
              <span className="inline-flex shrink-0 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                선택됨
              </span>
            )}
          </div>
          {staff.introduction && (
            <p className="mt-1 text-sm leading-5 text-muted-foreground line-clamp-2">
              {staff.introduction}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function StepSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Scissors;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}


function ServiceSelectableCard({
  service,
  selected,
  onClick,
}: {
  service: BeautyService;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-hidden rounded-2xl border text-left transition-colors ${
        selected ? "border-black/25 bg-primary/10" : "border-black/12 bg-background hover:bg-accent"
      }`}
    >
      {service.imageUrls?.[0] ? (
        <div
          className="aspect-[16/10] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${service.imageUrls[0]})` }}
          aria-label={`${service.name} 이미지`}
        />
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-muted/40 text-sm text-muted-foreground">
          이미지 미등록
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">{service.name}</h3>
          {selected ? (
            <span className="inline-flex shrink-0 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              선택됨
            </span>
          ) : null}
        </div>
        {service.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {service.description}
          </p>
        ) : null}
        <div className="mt-3 space-y-1">
          <p className="text-sm text-muted-foreground">예상 소요 시간 {service.durationMinutes}분</p>
          <p className="text-sm text-muted-foreground">
            기본 가격 {Number(service.price).toLocaleString()}원
          </p>
        </div>
      </div>
    </button>
  );
}

function BookingStatusPanel({
  selectedServiceName,
  selectedDesigner,
  selectedSlot,
  selectedService,
  onReset,
}: {
  selectedServiceName: string;
  selectedDesigner: string | null;
  selectedSlot: string | null;
  selectedService: BeautyService | null;
  onReset: () => void;
}) {
  const allSelected = !!selectedDesigner && !!selectedSlot;

  return (
    <article className="rounded-2xl border border-black/12 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">예약 현황</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          초기화
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <StatusItem
          label="시술"
          value={selectedServiceName}
          done={selectedServiceName !== "선택 전"}
          detail={selectedService ? `${selectedService.durationMinutes}분 · ${Number(selectedService.price).toLocaleString()}원` : undefined}
        />
        <StatusItem
          label="디자이너"
          value={selectedDesigner ?? "선택 전"}
          done={!!selectedDesigner}
        />
        <StatusItem
          label="예약 시간"
          value={selectedSlot ?? "선택 전"}
          done={!!selectedSlot}
        />
      </div>

      {allSelected ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-700">선택 완료</p>
          <p className="mt-1 text-sm text-emerald-900">
            {selectedDesigner} · {selectedSlot}
          </p>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
          >
            예약 요청 보내기
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-muted/20 p-4 text-xs text-muted-foreground">
          시술 → 디자이너 → 시간을 순서대로 선택하면 예약 요청이 활성화됩니다.
        </div>
      )}
    </article>
  );
}

function StatusItem({
  label,
  value,
  done,
  detail,
}: {
  label: string;
  value: string;
  done: boolean;
  detail?: string;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${done ? "border-black/12 bg-background" : "border-dashed border-black/10 bg-muted/20"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {done && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      </div>
      <p className={`mt-1 text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
        {value}
      </p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function SlotSelectableCard({
  slot,
  selected,
  compact = false,
  onClick,
}: {
  slot: ReservationSlot;
  selected: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const disabled = !slot.selectable;
  const meta = slotStatusMeta[slot.status];
  const timeRange = formatTimeRange(slot);
  const designerNames = slot.availableStaff.map((designer) => designer.name).join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
        selected ? "border-black/25 bg-primary/10" : meta.className
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{formatDateLabelFromIso(slot.startAt)}</p>
          <h3 className="mt-1 text-base font-semibold text-foreground">{timeRange}</h3>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
            selected ? "bg-primary text-primary-foreground" : meta.badgeClassName
          }`}
        >
          {selected ? "선택됨" : meta.label}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm text-muted-foreground">{meta.description}</p>
        <p className="text-sm text-muted-foreground">
          {designerNames || slot.reason}
        </p>
      </div>
      <div className={`mt-3 grid gap-1 ${slot.occupiedUnitCount > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
        {Array.from({ length: Math.max(slot.occupiedUnitCount, 1) }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full ${
              selected ? "bg-primary" : slot.selectable ? "bg-emerald-300" : "bg-muted"
            }`}
          />
        ))}
      </div>
      {!compact && slot.availableStaff.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {slot.availableStaff.length}명 가능 · {slot.occupiedUnitCount}칸 점유
        </p>
      ) : null}
    </button>
  );
}


function getNextDateOptions(days: number) {
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const value = formatDateInput(date);
    return {
      value,
      shortLabel: index === 0 ? "오늘" : index === 1 ? "내일" : formatWeekday(date),
      label: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00+09:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(parsed);
}

function formatDateLabelFromIso(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatTimeRange(slot: ReservationSlot) {
  return formatTimeRangeFromIso(slot.startAt, slot.endAt);
}

function formatTimeRangeFromIso(startAt: string | null, endAt: string | null) {
  if (!startAt || !endAt) return "시간 선택 전";
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Seoul",
  });
  return `${formatter.format(new Date(startAt))} ~ ${formatter.format(new Date(endAt))}`;
}

