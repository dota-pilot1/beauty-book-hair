import { useQuery } from "@tanstack/react-query";
import { staffApi } from "../api/staffApi";

export function useStaffByService(beautyServiceId: number | null) {
  return useQuery({
    queryKey: ["staff", { beautyServiceId }],
    queryFn: () => staffApi.list({ beautyServiceId: beautyServiceId! }),
    enabled: beautyServiceId != null,
  });
}

export function useStaffByServices(beautyServiceIds: number[]) {
  const enabled = beautyServiceIds.length > 0;
  return useQuery({
    queryKey: ["staff", { beautyServiceIds }],
    queryFn: () => staffApi.list({ beautyServiceIds }),
    enabled,
  });
}
