import { api } from "@/shared/api/axios";
import type {
  BeautyService,
  BeautyServiceTargetGender,
} from "../model/types";

export type CreateBeautyServiceBody = {
  code: string;
  name: string;
  categoryId: number;
  description?: string;
  durationMinutes: number;
  price: number;
  targetGender: BeautyServiceTargetGender;
  visible: boolean;
  displayOrder: number;
  imageUrls?: string[];
};

export type UpdateBeautyServiceBody = Omit<CreateBeautyServiceBody, "code">;

export const beautyServiceApi = {
  list: (params?: {
    categoryId?: number;
    targetGender?: BeautyServiceTargetGender;
    visible?: boolean;
  }) =>
    api.get<BeautyService[]>("/api/beauty-services", { params }).then((r) => r.data),

  get: (id: number) =>
    api.get<BeautyService>(`/api/beauty-services/${id}`).then((r) => r.data),

  create: (body: CreateBeautyServiceBody) =>
    api.post<BeautyService>("/api/beauty-services", body).then((r) => r.data),

  update: (id: number, body: UpdateBeautyServiceBody) =>
    api.patch<BeautyService>(`/api/beauty-services/${id}`, body).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/beauty-services/${id}`).then((r) => r.data),
};
