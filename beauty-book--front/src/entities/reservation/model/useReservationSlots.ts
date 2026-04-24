"use client";

import { useQuery } from "@tanstack/react-query";
import { reservationSlotApi } from "../api/reservationSlotApi";

export function useReservationSlots(params: {
  beautyServiceId: number | null;
  date: string;
  staffId?: number | null;
}) {
  const { beautyServiceId, date, staffId } = params;

  return useQuery({
    queryKey: ["reservation-slots", { beautyServiceId, date, staffId }],
    queryFn: () =>
      reservationSlotApi.list({
        beautyServiceId: beautyServiceId as number,
        date,
        staffId,
      }),
    enabled: beautyServiceId != null,
  });
}
