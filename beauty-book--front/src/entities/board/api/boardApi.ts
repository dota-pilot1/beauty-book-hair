import { api } from "@/shared/api/axios";
import type { BoardConfig, BoardSummary, BoardDetail, PageResponse } from "../model/types";

export type CreateBoardConfigBody = {
  code: string;
  kind: string;
  displayName: string;
  description?: string;
  allowCustomerWrite?: boolean;
  allowComment?: boolean;
  sortOrder?: number;
};

export type CreateBoardPostBody = {
  title: string;
  content?: string;
  status?: string;
  isPinned?: boolean;
};

export type UpdateBoardPostBody = {
  title?: string;
  content?: string;
  status?: string;
  isPinned?: boolean;
  isAnswered?: boolean;
};

export const boardApi = {
  // 공개 API
  listConfigs: () =>
    api.get<BoardConfig[]>("/api/boards/configs").then((r) => r.data),

  listPosts: (code: string, page = 0, size = 20) =>
    api
      .get<PageResponse<BoardSummary>>(`/api/boards/${code}`, { params: { page, size } })
      .then((r) => r.data),

  getPost: (code: string, id: number) =>
    api.get<BoardDetail>(`/api/boards/${code}/${id}`).then((r) => r.data),

  // 관리자 API
  adminListConfigs: () =>
    api.get<BoardConfig[]>("/api/admin/board-configs").then((r) => r.data),

  adminCreateConfig: (body: CreateBoardConfigBody) =>
    api.post<BoardConfig>("/api/admin/board-configs", body).then((r) => r.data),

  adminListPosts: (code: string, page = 0, size = 20) =>
    api
      .get<PageResponse<BoardSummary>>(`/api/admin/boards/${code}`, { params: { page, size } })
      .then((r) => r.data),

  adminCreatePost: (code: string, body: CreateBoardPostBody) =>
    api.post<BoardDetail>(`/api/admin/boards/${code}`, body).then((r) => r.data),

  adminUpdatePost: (id: number, body: UpdateBoardPostBody) =>
    api.patch<BoardDetail>(`/api/admin/boards/${id}`, body).then((r) => r.data),

  adminDeletePost: (id: number) =>
    api.delete(`/api/admin/boards/${id}`),

  adminPinPost: (id: number) =>
    api.post(`/api/admin/boards/${id}/pin`).then((r) => r.data),

  adminUnpinPost: (id: number) =>
    api.delete(`/api/admin/boards/${id}/pin`),
};
