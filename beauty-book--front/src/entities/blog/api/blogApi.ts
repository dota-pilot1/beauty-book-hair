import { api } from "@/shared/api/axios";
import type { BlogCategoryItem, BlogTagItem, BlogPostSummary, BlogPostDetail, PageResult } from "../model/types";

export type CreateBlogPostBody = {
  title: string;
  slug: string;
  content?: string;
  summary?: string;
  coverImageUrl?: string;
  authorStaffId?: number;
  authorName?: string;
  status: "DRAFT" | "PUBLISHED";
  isPinned?: boolean;
  tagNames?: string[];
};

export type UpdateBlogPostBody = Partial<CreateBlogPostBody>;

export type CreateBlogTagBody = {
  name: string;
  slug: string;
};

export const blogApi = {
  // 공개
  listPosts: (params?: { category?: string; tag?: string; page?: number; size?: number }) =>
    api.get<PageResult<BlogPostSummary>>("/api/blog/posts", { params }).then((r) => r.data),

  listPopularPosts: () =>
    api
      .get<PageResult<BlogPostSummary>>("/api/blog/posts", { params: { size: 5, popular: true } })
      .then((r) => r.data.content),

  listCategories: () =>
    api.get<BlogCategoryItem[]>("/api/blog/categories").then((r) => r.data),

  getPost: (slug: string) =>
    api.get<BlogPostDetail>(`/api/blog/posts/${slug}`).then((r) => r.data),

  listTags: () =>
    api.get<BlogTagItem[]>("/api/blog/tags").then((r) => r.data),

  adminCreateCategory: (body: { name: string; slug: string; displayOrder: number }) =>
    api.post<BlogCategoryItem>("/api/admin/blog/categories", body).then((r) => r.data),

  adminDeleteCategory: (id: number) => api.delete(`/api/admin/blog/categories/${id}`),

  suggestSlug: (title: string) =>
    api
      .get<{ slug: string }>("/api/admin/blog/posts/suggest-slug", { params: { title } })
      .then((r) => r.data.slug),

  // 어드민
  adminListAll: (params?: { page?: number; size?: number }) =>
    api.get<PageResult<BlogPostSummary>>("/api/admin/blog/posts", { params }).then((r) => r.data),

  adminCreatePost: (body: CreateBlogPostBody) =>
    api.post<BlogPostDetail>("/api/admin/blog/posts", body).then((r) => r.data),

  adminUpdatePost: (id: number, body: UpdateBlogPostBody) =>
    api.patch<BlogPostDetail>(`/api/admin/blog/posts/${id}`, body).then((r) => r.data),

  adminDeletePost: (id: number) => api.delete(`/api/admin/blog/posts/${id}`),

  adminCreateTag: (body: CreateBlogTagBody) =>
    api.post<BlogTagItem>("/api/admin/blog/tags", body).then((r) => r.data),

  adminDeleteTag: (id: number) => api.delete(`/api/admin/blog/tags/${id}`),
};
