"use client";

import { useQuery } from "@tanstack/react-query";
import { reservationSlotApi } from "../api/reservationSlotApi";

export function useReservationSlots(params: {
  beautyServiceIds: number[];
  date: string;
  staffId?: number | null;
}) {
  const { beautyServiceIds, date, staffId } = params;
  const enabled = beautyServiceIds.length > 0;

  return useQuery({
    queryKey: ["reservation-slots", { beautyServiceIds, date, staffId }],
    queryFn: () =>
      reservationSlotApi.list({
        beautyServiceIds,
        date,
        staffId,
      }),
    enabled,
  });
}
