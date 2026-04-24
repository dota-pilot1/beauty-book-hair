import { api } from "@/shared/api/axios";
import type { Reservation } from "../model/types";

export type CreateReservationBody = {
  beautyServiceId: number;
  staffId: number;
  startAt: string;
  endAt: string;
  customerPhone: string;
  customerMemo?: string;
};

export const reservationApi = {
  create: (body: CreateReservationBody) =>
    api.post<Reservation>("/api/reservations", body).then((r) => r.data),

  listMine: () =>
    api.get<Reservation[]>("/api/reservations/me").then((r) => r.data),

  listByDate: (date: string) =>
    api.get<Reservation[]>("/api/reservations", { params: { date } }).then((r) => r.data),

  changeStatus: (id: number, status: string) =>
    api.patch<Reservation>(`/api/reservations/${id}/status`, { status }).then((r) => r.data),
};
