"use client";

import { useQuery } from "@tanstack/react-query";
import { scheduleApi } from "../api/scheduleApi";

export function useBusinessHours() {
  return useQuery({
    queryKey: ["business-hours"],
    queryFn: scheduleApi.listBusinessHours,
    staleTime: 1000 * 60 * 10, // 10분 캐시
  });
}
