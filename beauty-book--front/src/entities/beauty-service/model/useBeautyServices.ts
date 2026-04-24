"use client";

import { useQuery } from "@tanstack/react-query";
import { beautyServiceApi } from "../api/beautyServiceApi";
import type { BeautyServiceTargetGender } from "./types";

type UseBeautyServicesParams = {
  categoryId?: number;
  targetGender?: BeautyServiceTargetGender;
  visible?: boolean;
  queryKeySuffix?: string;
};

export function useBeautyServices(params: UseBeautyServicesParams = {}) {
  const { categoryId, targetGender, visible, queryKeySuffix = "list" } = params;

  return useQuery({
    queryKey: ["beauty-services", queryKeySuffix, { categoryId, targetGender, visible }],
    queryFn: () => beautyServiceApi.list({ categoryId, targetGender, visible }),
  });
}

export function useVisibleBeautyServices(queryKeySuffix = "visible-list") {
  return useBeautyServices({ visible: true, queryKeySuffix });
}
