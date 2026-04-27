"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReservationStatus } from "@/entities/reservation/model/types";
import { useDaySchedule, BLOCK_TYPE_LABELS } from "../model/useDaySchedule";

const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 52;

const STATUS_META: Record<ReservationStatus, { label: string; bg: string; border: string; text: string }> = {
  REQUESTED:             { label: "승인 대기",   bg: "bg-amber-50",   border: "border-amber-300",   text: "text-amber-700" },
  CONFIRMED:             { label: "예약 확정",   bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700" },
  COMPLETED:             { label: "완료",        bg: "bg-blue-50",    border: "border-blue-300",    text: "text-blue-700" },
  NO_SHOW:               { label: "노쇼",        bg: "bg-rose-50",    border: "border-rose-300",    text: "text-rose-700" },
  CANCELLED_BY_CUSTOMER: { label: "고객 취소",   bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-500" },
  CANCELLED_BY_ADMIN:    { label: "관리자 취소", bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-500" },
};

function getDateOptions(days = 7) {
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const shortLabel = i === 0 ? "오늘" : i === 1 ? "내일" : new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(d);
    const dayLabel = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(d);
    return { value, shortLabel, dayLabel };
  });
}

function isoToKSTMinutes(iso: string): number {
  const kst = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return kst.getHours() * 60 + kst.getMinutes();
}

function formatKSTTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

function minutesToHHMM(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function generateSlots(startMin: number, endMin: number) {
  const slots: { label: string; minutes: number }[] = [];
  const slotStart = Math.floor(startMin / SLOT_MINUTES) * SLOT_MINUTES;
  const slotEnd = Math.ceil(endMin / SLOT_MINUTES) * SLOT_MINUTES;
  for (let m = slotStart; m < slotEnd; m += SLOT_MINUTES) {
    slots.push({ label: minutesToHHMM(m), minutes: m });
  }
  return slots;
}

type Props = {
  open: boolean;
  onClose: () => void;
  staffName: string;
  staffId: number;
  initialDate: string;
};

export function AdminDesignerScheduleDialog({ open, onClose, staffName, staffId, initialDate }: Props) {
  const dateOptions = getDateOptions(7);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const schedule = useDaySchedule(staffId, selectedDate, open);
  const { isLoading, isStoreClosed, isStaffOff, startMinutes, endMinutes, blockedRanges, offDutyRanges, reservations } = schedule;

  const slots = generateSlots(startMinutes, endMinutes);
  const baseMinutes = slots.length > 0 ? slots[0].minutes : 0;
  const containerHeight = slots.length * SLOT_HEIGHT;

  const sorted = [...reservations].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  function topPxFromMinutes(m: number) {
    return Math.max(0, ((m - baseMinutes) / SLOT_MINUTES) * SLOT_HEIGHT);
  }

  function topPxFromIso(iso: string) {
    return topPxFromMinutes(isoToKSTMinutes(iso));
  }

  function heightPxFromIso(startIso: string, endIso: string) {
    const dur = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
    return Math.max(SLOT_HEIGHT, (dur / SLOT_MINUTES) * SLOT_HEIGHT);
  }

  function heightPxFromMinutes(start: number, end: number) {
    return Math.max(SLOT_HEIGHT, ((end - start) / SLOT_MINUTES) * SLOT_HEIGHT);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="text-sm font-semibold">{staffName} 스케쥴</Dialog.Title>
            <Dialog.Close onClick={onClose} className="rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* 날짜 토글 */}
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-4 py-2.5">
            {dateOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedDate(opt.value)}
                className={`flex shrink-0 flex-col items-center rounded-lg px-2.5 py-1.5 text-center transition-colors ${
                  selectedDate === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-[11px] font-medium">{opt.shortLabel}</span>
                <span className="text-[10px] opacity-70">{opt.dayLabel}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
            {isLoading ? (
              <SkeletonTimeline />
            ) : (
              <Timeline
                slots={slots}
                containerHeight={containerHeight}
                isStoreClosed={isStoreClosed}
                isStaffOff={isStaffOff}
                staffName={staffName}
                offDutyRanges={offDutyRanges.map((o) => ({
                  topPx: topPxFromMinutes(o.startMinutes),
                  heightPx: heightPxFromMinutes(o.startMinutes, o.endMinutes),
                }))}
                blockedRanges={blockedRanges.map((b) => ({
                  ...b,
                  topPx: topPxFromMinutes(b.startMinutes),
                  heightPx: heightPxFromMinutes(b.startMinutes, b.endMinutes),
                }))}
                reservations={sorted.map((r) => ({
                  reservation: r,
                  topPx: topPxFromIso(r.startAt),
                  heightPx: heightPxFromIso(r.startAt, r.endAt),
                }))}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SkeletonTimeline() {
  return (
    <div className="space-y-2 pt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
      ))}
    </div>
  );
}

type TimelineProps = {
  slots: { label: string; minutes: number }[];
  containerHeight: number;
  isStoreClosed: boolean;
  isStaffOff: boolean;
  staffName: string;
  offDutyRanges: Array<{
    topPx: number;
    heightPx: number;
  }>;
  blockedRanges: Array<{
    blockType: keyof typeof BLOCK_TYPE_LABELS;
    reason: string | null;
    startMinutes: number;
    endMinutes: number;
    topPx: number;
    heightPx: number;
  }>;
  reservations: Array<{
    reservation: import("@/entities/reservation/model/types").Reservation;
    topPx: number;
    heightPx: number;
  }>;
};

function Timeline({ slots, containerHeight, isStoreClosed, isStaffOff, staffName, offDutyRanges, blockedRanges, reservations }: TimelineProps) {
  const isEmpty = !isStoreClosed && !isStaffOff && blockedRanges.length === 0 && reservations.length === 0;

  return (
    <div className="relative" style={{ height: `${containerHeight}px` }}>
      {/* 슬롯 라인 */}
      {slots.map((slot, i) => (
        <div
          key={slot.minutes}
          className="absolute left-0 right-0 flex items-start"
          style={{ top: `${i * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
        >
          <span className="w-11 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground/50">
            {slot.label}
          </span>
          <div className="mt-2 flex-1 border-t border-dashed border-border/40" />
        </div>
      ))}

      {/* 근무 외 시간 오버레이 */}
      {offDutyRanges.map((o, i) => (
        <div
          key={`off-${i}`}
          className="absolute left-13 right-0 flex items-center justify-center overflow-hidden rounded-lg bg-slate-100/80 px-2.5 py-1.5"
          style={{ top: `${o.topPx}px`, height: `${o.heightPx}px` }}
        >
          <p className="truncate text-[11px] font-medium text-slate-400">근무 외</p>
        </div>
      ))}

      {/* 차단 시간 블록 */}
      {blockedRanges.map((b, i) => (
        <div
          key={`block-${i}`}
          className="absolute left-13 right-0 flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5"
          style={{
            top: `${b.topPx}px`,
            height: `${b.heightPx}px`,
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 6px, rgba(0,0,0,0.08) 6px, rgba(0,0,0,0.08) 12px)",
          }}
        >
          <p className="truncate text-[11px] font-medium text-muted-foreground">
            {BLOCK_TYPE_LABELS[b.blockType]}
            {b.reason ? ` · ${b.reason}` : ""}
          </p>
        </div>
      ))}

      {/* 예약 블록 */}
      {reservations.map(({ reservation: r, topPx, heightPx }) => {
        const meta = STATUS_META[r.status];
        const serviceNames = r.items.length > 0
          ? r.items.map((item) => item.beautyServiceName).join(", ")
          : r.beautyServiceName;
        return (
          <div
            key={r.id}
            className={`absolute left-13 right-0 overflow-hidden rounded-lg border px-2.5 py-1.5 ${meta.bg} ${meta.border}`}
            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
          >
            <div className="flex items-start justify-between gap-1">
              <p className="truncate text-xs font-semibold text-foreground">{serviceNames}</p>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.text}`}>
                {meta.label}
              </span>
            </div>
            {r.customerName && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{r.customerName}</p>
            )}
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">
              {formatKSTTime(r.startAt)} ~ {formatKSTTime(r.endAt)}
            </p>
          </div>
        );
      })}

      {/* 매장 휴무 오버레이 */}
      {isStoreClosed && (
        <>
          <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px]" />
          <div className="sticky top-1/3 z-20 flex justify-center">
            <p className="rounded-full bg-foreground/85 px-4 py-1.5 text-xs font-medium text-background shadow-sm">
              🚪 이 날은 매장 휴무일입니다
            </p>
          </div>
        </>
      )}

      {/* 직원 개인 휴무 오버레이 */}
      {!isStoreClosed && isStaffOff && (
        <>
          <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px]" />
          <div className="sticky top-1/3 z-20 flex justify-center">
            <p className="rounded-full bg-rose-500/90 px-4 py-1.5 text-xs font-medium text-white shadow-sm">
              💆 {staffName} 디자이너 휴무일
            </p>
          </div>
        </>
      )}

      {/* 예약/차단 둘 다 없을 때 */}
      {isEmpty && (
        <div className="sticky top-1/3 z-10 flex justify-center">
          <p className="rounded-full bg-muted/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            이 날 예약이 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
