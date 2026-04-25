import { api } from "@/shared/api/axios";
import type { ReservationSlot } from "../model/types";

export const reservationSlotApi = {
  list: (params: {
    beautyServiceIds: number[];
    date: string;
    staffId?: number | null;
  }) =>
    api
      .get<ReservationSlot[]>("/api/reservation-slots", {
        params: {
          beautyServiceIds: params.beautyServiceIds.join(","),
          date: params.date,
          staffId: params.staffId ?? undefined,
        },
      })
      .then((r) => r.data),
};
