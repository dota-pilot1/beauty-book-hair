"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { galleryApi } from "../api/galleryApi";
import type { GalleryCreateBody, GalleryUpdateBody } from "../api/galleryApi";
import type { GalleryTag } from "./types";

export function usePublicGallery(tag?: GalleryTag, designerId?: number, page = 0) {
  return useQuery({
    queryKey: ["gallery-public", tag, designerId, page],
    queryFn: () => galleryApi.listPublic({ tag, designerId, page, size: 12 }),
  });
}

export function usePublicGalleryItem(id: number) {
  return useQuery({
    queryKey: ["gallery-item", id],
    queryFn: () => galleryApi.getPublic(id),
    enabled: Boolean(id),
  });
}

export function useAdminGallery(page = 0) {
  return useQuery({
    queryKey: ["admin-gallery", page],
    queryFn: () => galleryApi.adminList({ page, size: 20 }),
  });
}

export function useCreateGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GalleryCreateBody) => galleryApi.adminCreate(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery-public"] });
    },
  });
}

export function useUpdateGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: GalleryUpdateBody }) =>
      galleryApi.adminUpdate(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery-public"] });
    },
  });
}

export function useToggleGalleryPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => galleryApi.adminTogglePublish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery-public"] });
    },
  });
}

export function useDeleteGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => galleryApi.adminDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery-public"] });
    },
  });
}
