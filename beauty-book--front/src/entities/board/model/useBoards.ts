"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "../api/boardApi";
import type { CreateBoardConfigBody, CreateBoardPostBody, UpdateBoardPostBody } from "../api/boardApi";

// 공개 hooks
export function useBoardConfigs() {
  return useQuery({
    queryKey: ["board-configs"],
    queryFn: boardApi.listConfigs,
  });
}

export function useBoardPosts(code: string, page = 0) {
  return useQuery({
    queryKey: ["board-posts", code, page],
    queryFn: () => boardApi.listPosts(code, page),
    enabled: Boolean(code),
  });
}

export function useBoardPost(code: string, id: number) {
  return useQuery({
    queryKey: ["board-post", code, id],
    queryFn: () => boardApi.getPost(code, id),
    enabled: Boolean(code) && Boolean(id),
  });
}

// 관리자 hooks
export function useAdminBoardConfigs() {
  return useQuery({
    queryKey: ["admin-board-configs"],
    queryFn: boardApi.adminListConfigs,
  });
}

export function useAdminBoardPosts(code: string, page = 0) {
  return useQuery({
    queryKey: ["admin-board-posts", code, page],
    queryFn: () => boardApi.adminListPosts(code, page),
    enabled: Boolean(code),
  });
}

export function useCreateBoardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBoardConfigBody) => boardApi.adminCreateConfig(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-board-configs"] });
      queryClient.invalidateQueries({ queryKey: ["board-configs"] });
    },
  });
}

export function useDeleteBoardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => boardApi.adminDeleteConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-board-configs"] });
      queryClient.invalidateQueries({ queryKey: ["board-configs"] });
    },
  });
}

export function useCreateBoardPost(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBoardPostBody) => boardApi.adminCreatePost(code, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-board-posts", code] });
      queryClient.invalidateQueries({ queryKey: ["board-posts", code] });
    },
  });
}

export function useUpdateBoardPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateBoardPostBody }) =>
      boardApi.adminUpdatePost(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-board-posts"] });
      queryClient.invalidateQueries({ queryKey: ["board-posts"] });
    },
  });
}

export function useDeleteBoardPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => boardApi.adminDeletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-board-posts"] });
      queryClient.invalidateQueries({ queryKey: ["board-posts"] });
    },
  });
}

export function usePinBoardPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => boardApi.adminPinPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-board-posts"] });
      queryClient.invalidateQueries({ queryKey: ["board-posts"] });
    },
  });
}

export function useUnpinBoardPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => boardApi.adminUnpinPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-board-posts"] });
      queryClient.invalidateQueries({ queryKey: ["board-posts"] });
    },
  });
}
