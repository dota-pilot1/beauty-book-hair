import { api } from "@/shared/api/axios";
import type { Staff } from "../model/types";

export const staffApi = {
  list: (params?: { beautyServiceId?: number; beautyServiceIds?: number[] }) => {
    const query: Record<string, string | number> = {};
    if (params?.beautyServiceIds && params.beautyServiceIds.length > 0) {
      query.beautyServiceIds = params.beautyServiceIds.join(",");
    } else if (params?.beautyServiceId != null) {
      query.beautyServiceId = params.beautyServiceId;
    }
    return api.get<Staff[]>("/api/staff", { params: query }).then((r) => r.data);
  },
};
