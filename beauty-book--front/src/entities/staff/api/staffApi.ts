import { api } from "@/shared/api/axios";
import type { Staff } from "../model/types";

export const staffApi = {
  list: (params?: { beautyServiceId?: number }) =>
    api.get<Staff[]>("/api/staff", { params }).then((r) => r.data),
};
