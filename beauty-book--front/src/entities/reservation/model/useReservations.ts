"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reservationApi } from "../api/reservationApi";
import type { CreateReservationBody } from "../api/reservationApi";

export function useMyReservations() {
  return useQuery({
    queryKey: ["reservations", "me"],
    queryFn: reservationApi.listMine,
  });
}

export function useReservationsByDate(date: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["reservations", "date", date],
    queryFn: () => reservationApi.listByDate(date),
    enabled,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReservationBody) => reservationApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["reservation-slots"] });
    },
  });
}

export function useChangeReservationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, adminMemo }: { id: number; status: string; adminMemo?: string }) =>
      reservationApi.changeStatus(id, status, adminMemo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reservationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useDeletedReservationsByDate(date: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["reservations", "deleted", date],
    queryFn: () => reservationApi.listDeleted(date),
    enabled,
  });
}

export function useAllDeletedReservations() {
  return useQuery({
    queryKey: ["reservations", "deleted", "all"],
    queryFn: reservationApi.listAllDeleted,
  });
}

export function usePendingReservations() {
  return useQuery({
    queryKey: ["reservations", "pending"],
    queryFn: reservationApi.listPending,
    refetchInterval: 30_000,
  });
}
