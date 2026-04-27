"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "../api/blogApi";
import type { CreateBlogPostBody, UpdateBlogPostBody, CreateBlogTagBody } from "../api/blogApi";

export function useBlogPosts(category?: string, page = 0) {
  return useQuery({
    queryKey: ["blog-posts", category, page],
    queryFn: () => blogApi.listPosts({ category, page, size: 9 }),
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => blogApi.getPost(slug),
    enabled: Boolean(slug),
  });
}

export function useBlogTags() {
  return useQuery({
    queryKey: ["blog-tags"],
    queryFn: blogApi.listTags,
    staleTime: 1000 * 60 * 10,
  });
}

export function useBlogPopularPosts() {
  return useQuery({
    queryKey: ["blog-popular"],
    queryFn: blogApi.listPopularPosts,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: blogApi.listCategories,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; slug: string; displayOrder: number }) =>
      blogApi.adminCreateCategory(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-categories"] }),
  });
}

export function useUpdateBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name: string; slug: string; displayOrder: number } }) =>
      blogApi.adminUpdateCategory(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-categories"] }),
  });
}

export function useDeleteBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => blogApi.adminDeleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-categories"] }),
  });
}

export function useAdminBlogPosts(page = 0) {
  return useQuery({
    queryKey: ["admin-blog-posts", page],
    queryFn: () => blogApi.adminListAll({ page, size: 20 }),
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBlogPostBody) => blogApi.adminCreatePost(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateBlogPostBody }) =>
      blogApi.adminUpdatePost(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["blog-post"] });
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => blogApi.adminDeletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });
}

export function useCreateBlogTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBlogTagBody) => blogApi.adminCreateTag(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-tags"] }),
  });
}

export function useDeleteBlogTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => blogApi.adminDeleteTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-tags"] }),
  });
}
