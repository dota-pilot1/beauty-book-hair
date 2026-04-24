import { api } from "@/shared/api/axios";
import type { BeautyServiceCategory } from "@/entities/beauty-service/model/types";

export type CreateBeautyServiceCategoryBody = {
  code: string;
  name: string;
  description?: string;
  visible: boolean;
  displayOrder?: number;
};

export type UpdateBeautyServiceCategoryBody = Omit<CreateBeautyServiceCategoryBody, "code"> & {
  displayOrder: number;
};

export const beautyServiceCategoryApi = {
  list: (params?: { visible?: boolean }) =>
    api
      .get<BeautyServiceCategory[]>("/api/beauty-service-categories", { params })
      .then((r) => r.data),

  get: (id: number) =>
    api.get<BeautyServiceCategory>(`/api/beauty-service-categories/${id}`).then((r) => r.data),

  create: (body: CreateBeautyServiceCategoryBody) =>
    api.post<BeautyServiceCategory>("/api/beauty-service-categories", body).then((r) => r.data),

  update: (id: number, body: UpdateBeautyServiceCategoryBody) =>
    api.patch<BeautyServiceCategory>(`/api/beauty-service-categories/${id}`, body).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/beauty-service-categories/${id}`).then((r) => r.data),
};
