"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/axios";
import { reservationApi } from "@/entities/reservation/api/reservationApi";
import type { Reservation } from "@/entities/reservation/model/types";

export type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

export type BlockedTimeType =
  | "STORE_CLOSED" | "DESIGNER_OFF" | "LUNCH"
  | "EDUCATION" | "PERSONAL" | "ETC";

type BusinessHourItem = {
  id: number;
  dayOfWeek: DayOfWeek;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
};

type BlockedTimeItem = {
  id: number;
  staffId: number | null;
  startAt: string;
  endAt: string;
  reason: string | null;
  blockType: BlockedTimeType;
};

type RecurringBlockedTimeItem = {
  id: number;
  staffId: number | null;
  daysOfWeek: DayOfWeek[];
  startTime: string;
  endTime: string;
  blockType: BlockedTimeType;
  reason: string | null;
  active: boolean;
};

const DAY_OF_WEEK_MAP: DayOfWeek[] = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY",
  "THURSDAY", "FRIDAY", "SATURDAY",
];

function getDayOfWeek(dateStr: string): DayOfWeek {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return DAY_OF_WEEK_MAP[date.getUTCDay()];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isoToKSTMinutes(iso: string): number {
  const kst = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return kst.getHours() * 60 + kst.getMinutes();
}

function isoToKSTDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export type BlockedRange = {
  startMinutes: number;
  endMinutes: number;
  blockType: BlockedTimeType;
  reason: string | null;
};

export type DaySchedule = {
  isLoading: boolean;
  isStoreClosed: boolean;
  startMinutes: number;
  endMinutes: number;
  blockedRanges: BlockedRange[];
  reservations: Reservation[];
};

export function useDaySchedule(staffId: number, date: string, enabled: boolean): DaySchedule {
  const dayOfWeek = getDayOfWeek(date);
  const [y, m] = date.split("-").map(Number);

  const businessHoursQ = useQuery({
    queryKey: ["business-hours"],
    queryFn: () => api.get<BusinessHourItem[]>("/api/schedules/business-hours").then((r) => r.data),
    enabled,
  });

  const monthStart = new Date(Date.UTC(y, m - 1, 1)).toISOString();
  const monthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59)).toISOString();

  const blockedTimesQ = useQuery({
    queryKey: ["admin-blocked-times", y, m],
    queryFn: () =>
      api
        .get<BlockedTimeItem[]>("/api/admin/schedules/blocked-times", {
          params: { startAt: monthStart, endAt: monthEnd },
        })
        .then((r) => r.data),
    enabled,
  });

  const recurringBlocksQ = useQuery({
    queryKey: ["recurring-blocked-times"],
    queryFn: () =>
      api
        .get<RecurringBlockedTimeItem[]>("/api/admin/schedules/recurring-blocked-times")
        .then((r) => r.data),
    enabled,
  });

  const reservationsQ = useQuery({
    queryKey: ["reservations", "date", date],
    queryFn: () => reservationApi.listByDate(date),
    enabled,
  });

  const isLoading =
    businessHoursQ.isLoading ||
    blockedTimesQ.isLoading ||
    recurringBlocksQ.isLoading ||
    reservationsQ.isLoading;

  const businessHour = businessHoursQ.data?.find((bh) => bh.dayOfWeek === dayOfWeek);

  const startMinutes = businessHour?.openTime ? timeToMinutes(businessHour.openTime) : 9 * 60;
  const endMinutes = businessHour?.closeTime ? timeToMinutes(businessHour.closeTime) : 21 * 60;

  if (businessHour?.closed) {
    return {
      isLoading,
      isStoreClosed: true,
      startMinutes,
      endMinutes,
      blockedRanges: [],
      reservations: [],
    };
  }

  const dateBlocks: BlockedRange[] = (blockedTimesQ.data ?? [])
    .filter((b) => isoToKSTDate(b.startAt) === date)
    .filter((b) => b.staffId === null || b.staffId === staffId)
    .map((b) => ({
      startMinutes: isoToKSTMinutes(b.startAt),
      endMinutes: isoToKSTMinutes(b.endAt),
      blockType: b.blockType,
      reason: b.reason,
    }));

  const recurringBlocks: BlockedRange[] = (recurringBlocksQ.data ?? [])
    .filter((b) => b.active)
    .filter((b) => b.daysOfWeek.includes(dayOfWeek))
    .filter((b) => b.staffId === null || b.staffId === staffId)
    .map((b) => ({
      startMinutes: timeToMinutes(b.startTime),
      endMinutes: timeToMinutes(b.endTime),
      blockType: b.blockType,
      reason: b.reason,
    }));

  const blockedRanges = [...dateBlocks, ...recurringBlocks];
  const reservations = (reservationsQ.data ?? []).filter((r) => r.staffId === staffId);

  return {
    isLoading,
    isStoreClosed: false,
    startMinutes,
    endMinutes,
    blockedRanges,
    reservations,
  };
}

export const BLOCK_TYPE_LABELS: Record<BlockedTimeType, string> = {
  STORE_CLOSED: "🚪 매장 휴무",
  DESIGNER_OFF: "💆 디자이너 휴무",
  LUNCH: "🍱 점심 시간",
  EDUCATION: "📚 교육",
  PERSONAL: "🙏 개인 사정",
  ETC: "📌 기타",
};
