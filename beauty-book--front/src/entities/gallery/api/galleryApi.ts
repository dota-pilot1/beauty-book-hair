import { api } from "@/shared/api/axios";
import type { GalleryItem, GalleryPhotoType, GalleryTag, PageResult } from "../model/types";

export type GalleryCreateBody = {
  title: string;
  description?: string;
  imageUrls: string[];
  beforeImageUrl?: string;
  designerId?: number;
  designerName?: string;
  tag: GalleryTag;
  photoType: GalleryPhotoType;
  isPublished: boolean;
};

export type GalleryUpdateBody = GalleryCreateBody;

export const galleryApi = {
  // 공개
  listPublic: (params?: { tag?: GalleryTag; photoType?: GalleryPhotoType; designerId?: number; page?: number; size?: number }) =>
    api.get<PageResult<GalleryItem>>("/api/gallery", { params }).then((r) => r.data),

  getPublic: (id: number) =>
    api.get<GalleryItem>(`/api/gallery/${id}`).then((r) => r.data),

  // 어드민
  adminList: (params?: { page?: number; size?: number }) =>
    api.get<PageResult<GalleryItem>>("/api/admin/gallery", { params }).then((r) => r.data),

  adminCreate: (body: GalleryCreateBody) =>
    api.post<GalleryItem>("/api/admin/gallery", body).then((r) => r.data),

  adminUpdate: (id: number, body: GalleryUpdateBody) =>
    api.put<GalleryItem>(`/api/admin/gallery/${id}`, body).then((r) => r.data),

  adminTogglePublish: (id: number) =>
    api.patch<GalleryItem>(`/api/admin/gallery/${id}/publish`).then((r) => r.data),

  adminDelete: (id: number) =>
    api.delete(`/api/admin/gallery/${id}`).then((r) => r.data),
};
