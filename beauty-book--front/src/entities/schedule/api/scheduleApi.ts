import { api } from "@/shared/api/axios";

export type BusinessHourItem = {
  id: number;
  dayOfWeek:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
};

export const scheduleApi = {
  listBusinessHours: () =>
    api
      .get<BusinessHourItem[]>("/api/schedules/business-hours")
      .then((r) => r.data),
};
