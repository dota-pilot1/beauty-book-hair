"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MessageCircleMore,
  Scissors,
  Send,
  UserRound,
} from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { beautyServiceApi } from "@/entities/beauty-service/api/beautyServiceApi";
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
  {
    key: "confirm",
    title: "예약 확인",
    icon: Check,
  },
];

const designers = [
  { name: "수아 디자이너", specialty: "레이어드 컷, 자연스러운 펌" },
  { name: "민서 디자이너", specialty: "톤다운 컬러, 뿌리 염색" },
  { name: "유나 디자이너", specialty: "클리닉, 두피 케어" },
];

const slots = [
  "4월 29일 화요일 · 오전 10:30",
  "4월 29일 화요일 · 오후 1:00",
  "4월 29일 화요일 · 오후 4:30",
  "4월 30일 수요일 · 오전 11:00",
];

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
    selectedService,
    selectedDesigner,
    selectedSlot,
  } = useBookingFlow();

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["beauty-services", "booking"],
    queryFn: () => beautyServiceApi.list({ visible: true }),
  });

  useEffect(() => {
    bookingFlowActions.hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated || services.length === 0) return;
    const exists = services.some((service) => service.name === selectedService);
    if (!exists) {
      bookingFlowActions.setSelectedService(services[0].name);
    }
  }, [hydrated, services, selectedService]);

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
        <div className="space-y-4">
          <article className="rounded-2xl border border-black/12 bg-card p-6 shadow-sm">
            <h2 className="text-sm font-medium text-foreground">예약 요약</h2>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label="시술" value={selectedService} />
              <SummaryRow label="디자이너" value={selectedDesigner} />
              <SummaryRow label="예약 시간" value={selectedSlot} />
              <SummaryRow label="상태" value="예약 요청 전" />
            </div>
          </article>

          <article className="rounded-2xl border border-black/12 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircleMore className="h-4 w-4" />
              예약 상담 채팅 초안
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-black/10 bg-muted/20 p-3 text-sm text-muted-foreground">
                원하는 시간대가 없으면 채팅으로 일정 조율 요청을 남길 수 있습니다.
              </div>
              <div className="rounded-2xl border border-black/10 bg-background p-3 text-sm text-foreground">
                “이번 주 평일 저녁 7시 이후에 가능한가요?”
              </div>
              <div className="rounded-2xl border border-dashed border-black/15 bg-background p-3 text-sm text-muted-foreground">
                매장 답변 영역
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <Send className="h-4 w-4" />
                채팅 열기
              </button>
            </div>
          </article>
        </div>
      }
    >
        <div className="space-y-4">
          <section className="grid gap-3 xl:grid-cols-4">
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

        <section className="rounded-2xl border border-black/12 bg-card p-6 shadow-sm">
          {step === "service" ? (
            <StepSection
              icon={Scissors}
              title="시술 선택"
              description="예약할 시술을 고릅니다."
            >
              {servicesLoading ? (
                <p className="text-sm text-muted-foreground">시술 목록을 불러오는 중...</p>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground">등록된 시술이 없습니다. 관리자 화면에서 먼저 시술을 등록해주세요.</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  {services.map((service) => (
                    <SelectableCard
                      key={service.id}
                      selected={selectedService === service.name}
                      title={service.name}
                      lines={[
                        `예상 소요 시간 ${service.durationMinutes}분`,
                        `기본 가격 ${Number(service.price).toLocaleString()}원`,
                      ]}
                      onClick={() => bookingFlowActions.setSelectedService(service.name)}
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
              description="원하는 스타일에 맞는 디자이너를 고릅니다."
            >
              <div className="space-y-3">
                {designers.map((designer) => (
                  <SelectableRow
                    key={designer.name}
                    selected={selectedDesigner === designer.name}
                    title={designer.name}
                    description={designer.specialty}
                    onClick={() => bookingFlowActions.setSelectedDesigner(designer.name)}
                  />
                ))}
              </div>
            </StepSection>
          ) : null}

          {step === "schedule" ? (
            <StepSection
              icon={CalendarDays}
              title="날짜/시간 선택"
              description="가능한 시간대 중 원하는 슬롯을 고릅니다."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {slots.map((slot) => (
                  <SelectableCard
                    key={slot}
                    selected={selectedSlot === slot}
                    title={slot}
                    lines={["예약 가능", "선택 시 우측 예약 요약에 즉시 반영"]}
                    onClick={() => bookingFlowActions.setSelectedSlot(slot)}
                  />
                ))}
              </div>
            </StepSection>
          ) : null}

          {step === "confirm" ? (
            <StepSection
              icon={Check}
              title="예약 확인"
              description="선택 내용을 확인하고 예약 요청을 보냅니다."
            >
              <div className="rounded-2xl border border-black/12 bg-background p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <SummaryBox label="시술" value={selectedService} />
                  <SummaryBox label="디자이너" value={selectedDesigner} />
                  <SummaryBox label="예약 시간" value={selectedSlot} />
                  <SummaryBox label="요청 상태" value="승인 대기 예정" />
                </div>
                <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-muted/20 p-4 text-sm text-muted-foreground">
                  요청사항 입력 영역이 여기에 들어갑니다.
                </div>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  예약 요청 보내기
                </button>
                <button
                  type="button"
                  onClick={bookingFlowActions.reset}
                  className="mt-4 ml-3 inline-flex items-center justify-center rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  선택 초기화
                </button>
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
            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex === steps.length - 1}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음 단계
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </CustomerShell>
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
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SelectableCard({
  selected,
  title,
  lines,
  onClick,
}: {
  selected: boolean;
  title: string;
  lines: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-colors ${
        selected ? "border-black/25 bg-primary/10" : "border-black/12 bg-background hover:bg-accent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {selected ? (
          <span className="inline-flex rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            선택됨
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        {lines.map((line) => (
          <p key={line} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
    </button>
  );
}

function SelectableRow({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {selected ? (
          <span className="inline-flex rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            선택됨
          </span>
        ) : null}
      </div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-card px-4 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
