"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  LayoutGrid,
  List,
  Scissors,
  Search,
  UserRound,
  X,
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
import { useCreateReservation } from "@/entities/reservation/model/useReservations";
import { useBusinessHours } from "@/entities/schedule/model/useBusinessHours";

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
  PAST: {
    label: "지난 시간",
    description: "이미 지난 시간입니다.",
    className: "border-black/6 bg-muted/20 text-muted-foreground/50 opacity-50",
    badgeClassName: "bg-muted/60 text-muted-foreground/60",
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
    selectedServiceIds,
    selectedDate,
    selectedDesignerId,
    selectedDesigner,
    selectedStartAt,
    selectedEndAt,
    selectedSlot,
  } = useBookingFlow();

  const { data: services = [], isLoading: servicesLoading } = useVisibleBeautyServices("booking");
  const selectedServices = useMemo(
    () => selectedServiceIds.map((id) => services.find((s) => s.id === id)).filter(Boolean) as BeautyService[],
    [selectedServiceIds, services]
  );
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price ?? 0), 0);
  const dateOptions = useMemo(() => getNextDateOptions(7), []);

  const mainServiceId = selectedServiceIds[0] ?? null;
  const mainService = selectedServices[0] ?? null;
  const optionServices = selectedServices.slice(1);
  const { data: staffList = [], isLoading: staffLoading } = useStaffByService(mainServiceId);
  const createReservation = useCreateReservation();
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState("");
  const [serviceViewMode, setServiceViewMode] = useState<"card" | "table">("card");
  const [serviceQuery, setServiceQuery] = useState("");
  const [appliedServiceQuery, setAppliedServiceQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");

  // 서비스 목록에서 카테고리 추출 (중복 제거 + displayOrder 정렬)
  const categoryOptions = useMemo(() => {
    const map = new Map<number, { id: number; name: string; displayOrder: number }>();
    for (const s of services) {
      if (s.category && !map.has(s.category.id)) {
        map.set(s.category.id, {
          id: s.category.id,
          name: s.category.name,
          displayOrder: s.category.displayOrder ?? 0,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
    );
  }, [services]);

  const filteredServices = useMemo(() => {
    const q = appliedServiceQuery.trim().toLowerCase();
    return services.filter((s) => {
      if (selectedCategoryId !== "all" && s.category?.id !== selectedCategoryId) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [services, appliedServiceQuery, selectedCategoryId]);

  const {
    data: reservationSlots = [],
    isLoading: slotsLoading,
    isError: slotsError,
  } = useReservationSlots({
    beautyServiceIds: selectedServiceIds,
    date: selectedDate,
    staffId: selectedDesignerId ?? undefined,
  });

  const { data: businessHours = [] } = useBusinessHours();

  const isSelectedDateClosed = useMemo(() => {
    if (!selectedDate || businessHours.length === 0) return false;
    const dayNames = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"] as const;
    const dow = dayNames[new Date(selectedDate + "T00:00:00").getDay()];
    const bh = businessHours.find((h) => h.dayOfWeek === dow);
    return bh?.closed ?? false;
  }, [selectedDate, businessHours]);

  useEffect(() => {
    bookingFlowActions.hydrate();
  }, []);

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

  const canGoNext = step === "service"
    ? selectedServiceIds.length > 0
    : step === "designer"
      ? selectedDesignerId != null
      : true;

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
          mainService={mainService}
          optionServices={optionServices}
          totalDuration={totalDuration}
          totalPrice={totalPrice}
          selectedDesigner={selectedDesignerId ? selectedDesigner : null}
          selectedSlot={selectedStartAt ? selectedSlot : null}
          phoneInput={phoneInput}
          onPhoneChange={setPhoneInput}
          isPending={createReservation.isPending}
          onReset={bookingFlowActions.reset}
          onRemoveService={(id) => bookingFlowActions.toggleService(id)}
          onPromoteToMain={(id) => bookingFlowActions.promoteToMain(id)}
          onSubmit={() => {
            if (selectedServiceIds.length === 0 || !selectedDesignerId || !selectedStartAt || !selectedEndAt) return;
            createReservation.mutate(
              {
                beautyServiceIds: selectedServiceIds,
                staffId: selectedDesignerId,
                startAt: selectedStartAt,
                endAt: selectedEndAt,
                customerPhone: phoneInput,
              },
              {
                onSuccess: () => {
                  bookingFlowActions.reset();
                  router.push("/reservations");
                },
              }
            );
          }}
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
              description="가장 먼저 선택한 시술이 메인이 되고, 이어 선택한 시술은 옵션으로 함께 진행됩니다."
            >
              {servicesLoading ? (
                <p className="text-sm text-muted-foreground">시술 목록을 불러오는 중...</p>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground">등록된 시술이 없습니다. 관리자 화면에서 먼저 시술을 등록해주세요.</p>
              ) : (
                <>
                  {/* 카테고리 칩 */}
                  {categoryOptions.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      <CategoryChip
                        label="전체"
                        active={selectedCategoryId === "all"}
                        onClick={() => setSelectedCategoryId("all")}
                      />
                      {categoryOptions.map((c) => (
                        <CategoryChip
                          key={c.id}
                          label={c.name}
                          active={selectedCategoryId === c.id}
                          onClick={() => setSelectedCategoryId(c.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* 검색 + 뷰 토글 */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <form
                      className="relative flex-1 min-w-[200px] max-w-md"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setAppliedServiceQuery(serviceQuery);
                      }}
                    >
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="search"
                        value={serviceQuery}
                        onChange={(e) => {
                          const v = e.target.value;
                          setServiceQuery(v);
                          // 입력값이 비워지면(X 버튼 등) 즉시 필터 해제
                          if (v === "") setAppliedServiceQuery("");
                        }}
                        placeholder="시술 이름이나 설명으로 검색 (Enter)"
                        className="w-full rounded-xl border border-black/15 bg-background py-2 pl-9 pr-20 text-sm outline-none focus:border-primary"
                      />
                      {serviceQuery && serviceQuery !== appliedServiceQuery && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Enter
                        </span>
                      )}
                    </form>
                    <div className="inline-flex rounded-xl border border-black/10 bg-muted/30 p-1">
                      <button
                        type="button"
                        onClick={() => setServiceViewMode("card")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          serviceViewMode === "card"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        카드
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceViewMode("table")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          serviceViewMode === "table"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <List className="h-3.5 w-3.5" />
                        테이블
                      </button>
                    </div>
                  </div>

                  {filteredServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
                  ) : serviceViewMode === "card" ? (
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                      {filteredServices.map((service) => {
                        const idx = selectedServiceIds.indexOf(service.id);
                        const role = idx === -1 ? "none" : idx === 0 ? "main" : "option";
                        return (
                          <ServiceSelectableCard
                            key={service.id}
                            service={service}
                            role={role}
                            optionOrder={idx > 0 ? idx : null}
                            onClick={() => bookingFlowActions.toggleService(service.id)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <ServiceSelectableTable
                      services={filteredServices}
                      selectedServiceIds={selectedServiceIds}
                      onToggle={(id) => bookingFlowActions.toggleService(id)}
                      onPromoteToMain={(id) => bookingFlowActions.promoteToMain(id)}
                    />
                  )}
                </>
              )}
            </StepSection>
          ) : null}

          {step === "designer" ? (
            <StepSection
              icon={UserRound}
              title="디자이너 선택"
              description={mainService
                ? `메인 시술 "${mainService.name}"을 진행할 수 있는 디자이너입니다.${optionServices.length > 0 ? ` 옵션 ${optionServices.length}개는 같은 디자이너가 함께 진행합니다.` : ""}`
                : "먼저 시술을 선택해주세요."}
            >
              {selectedServiceIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">시술을 먼저 1개 이상 선택해주세요.</p>
              ) : staffLoading ? (
                <p className="text-sm text-muted-foreground">디자이너 목록을 불러오는 중...</p>
              ) : staffList.length === 0 ? (
                <p className="text-sm text-muted-foreground">메인 시술을 진행할 수 있는 디자이너가 없습니다. 메인 시술을 변경해주세요.</p>
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
              description={mainService
                ? `${mainService.name}${optionServices.length > 0 ? ` + 옵션 ${optionServices.length}개` : ""} · 총 ${totalDuration}분`
                : "디자이너를 먼저 선택해주세요."}
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
                {selectedServiceIds.length === 0 ? (
                  <p className="col-span-2 text-sm text-muted-foreground">시술을 먼저 선택해주세요.</p>
                ) : slotsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
                  ))
                ) : slotsError ? (
                  <p className="col-span-2 text-sm text-muted-foreground">가능한 시간을 불러오지 못했습니다.</p>
                ) : reservationSlots.length === 0 ? (
                  <p className="col-span-2 text-sm text-muted-foreground">
                    {isSelectedDateClosed
                      ? "휴무일입니다. 다른 날짜를 선택해주세요."
                      : "선택한 날짜에 예약 가능한 시간이 없습니다."}
                  </p>
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
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
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
  const ringClass = role === "main"
    ? "border-primary ring-2 ring-primary/40 bg-primary/5"
    : role === "option"
      ? "border-primary/60 ring-1 ring-primary/20 bg-primary/[0.03]"
      : "border-black/12 bg-background hover:bg-accent";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border text-left transition-colors ${ringClass}`}
    >
      {selected ? (
        <span
          className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
            role === "main"
              ? "bg-primary text-primary-foreground"
              : "bg-white/95 text-primary ring-1 ring-primary/40"
          }`}
        >
          {role === "main" ? "메인" : `옵션 ${optionOrder}`}
        </span>
      ) : null}
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
          <span
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-black/20 bg-background text-transparent"
            }`}
            aria-hidden
          >
            ✓
          </span>
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

function CategoryChip({
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
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-foreground text-background"
          : "border border-black/10 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ServiceSelectableTable({
  services,
  selectedServiceIds,
  onToggle,
  onPromoteToMain,
}: {
  services: BeautyService[];
  selectedServiceIds: number[];
  onToggle: (id: number) => void;
  onPromoteToMain: (id: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="w-16 px-3 py-2 text-left font-medium">선택</th>
            <th className="px-3 py-2 text-left font-medium">시술명</th>
            <th className="hidden px-3 py-2 text-left font-medium md:table-cell">설명</th>
            <th className="w-24 px-3 py-2 text-right font-medium">시간</th>
            <th className="w-32 px-3 py-2 text-right font-medium">가격</th>
            <th className="w-24 px-3 py-2 text-right font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {services.map((service) => {
            const idx = selectedServiceIds.indexOf(service.id);
            const role = idx === -1 ? "none" : idx === 0 ? "main" : "option";
            const selected = role !== "none";

            return (
              <tr
                key={service.id}
                onClick={() => onToggle(service.id)}
                className={`cursor-pointer transition-colors ${
                  role === "main"
                    ? "bg-primary/10"
                    : role === "option"
                      ? "bg-primary/5"
                      : "hover:bg-accent"
                }`}
              >
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-bold ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-black/20 bg-background text-transparent"
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {role === "main" && (
                      <span className="inline-flex shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        메인
                      </span>
                    )}
                    {role === "option" && (
                      <span className="inline-flex shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground ring-1 ring-primary/30">
                        옵션 {idx}
                      </span>
                    )}
                    <span className="font-medium text-foreground">{service.name}</span>
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                  <span className="line-clamp-1">{service.description ?? "—"}</span>
                </td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">
                  {service.durationMinutes}분
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-foreground">
                  {Number(service.price).toLocaleString()}원
                </td>
                <td className="px-3 py-2.5 text-right">
                  {role === "option" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPromoteToMain(service.id);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      메인으로
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BookingStatusPanel({
  mainService,
  optionServices,
  totalDuration,
  totalPrice,
  selectedDesigner,
  selectedSlot,
  phoneInput,
  onPhoneChange,
  isPending,
  onReset,
  onRemoveService,
  onPromoteToMain,
  onSubmit,
}: {
  mainService: BeautyService | null;
  optionServices: BeautyService[];
  totalDuration: number;
  totalPrice: number;
  selectedDesigner: string | null;
  selectedSlot: string | null;
  phoneInput: string;
  onPhoneChange: (v: string) => void;
  isPending: boolean;
  onReset: () => void;
  onRemoveService: (id: number) => void;
  onPromoteToMain: (id: number) => void;
  onSubmit: () => void;
}) {
  const totalCount = (mainService ? 1 : 0) + optionServices.length;
  const allSelected = !!mainService && !!selectedDesigner && !!selectedSlot;

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
        <div className="rounded-xl border border-black/12 bg-background px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">시술</p>
            {totalCount > 0 && (
              <span className="text-[11px] text-muted-foreground">{totalCount}개</span>
            )}
          </div>

          {!mainService ? (
            <p className="mt-1 text-sm text-muted-foreground">선택 전</p>
          ) : (
            <div className="mt-2 space-y-2">
              {/* 메인 */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/5 px-2.5 py-2 ring-1 ring-primary/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">메인</span>
                    <p className="truncate text-sm font-medium text-foreground">{mainService.name}</p>
                  </div>
                  <p className="mt-0.5 pl-[34px] text-[11px] text-muted-foreground">
                    {mainService.durationMinutes}분 · {Number(mainService.price).toLocaleString()}원
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveService(mainService.id)}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`${mainService.name} 제거`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 옵션 */}
              {optionServices.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">옵션 {i + 1}</span>
                      <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 pl-[44px] text-[11px] text-muted-foreground">
                      <span>{s.durationMinutes}분 · {Number(s.price).toLocaleString()}원</span>
                      <button
                        type="button"
                        onClick={() => onPromoteToMain(s.id)}
                        className="text-primary hover:underline"
                      >
                        메인으로
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveService(s.id)}
                    className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`${s.name} 제거`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalCount > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-2 text-xs">
              <span className="text-muted-foreground">합계</span>
              <span className="font-semibold text-foreground">
                {totalDuration}분 · {totalPrice.toLocaleString()}원
              </span>
            </div>
          )}
        </div>
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
          <input
            type="tel"
            placeholder="연락처 (010-0000-0000)"
            value={phoneInput}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="mt-3 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !phoneInput.trim()}
            className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "요청 중..." : "예약 요청 보내기"}
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
