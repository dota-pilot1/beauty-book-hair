"use client";

import { Store, useStore } from "@tanstack/react-store";

export type BookingStepKey = "service" | "designer" | "schedule" | "confirm";

export type BookingFlowState = {
  hydrated: boolean;
  step: BookingStepKey;
  selectedService: string;
  selectedDesigner: string;
  selectedSlot: string;
};

const STORAGE_KEY = "booking-flow-draft";

const DEFAULT_STATE: BookingFlowState = {
  hydrated: false,
  step: "service",
  selectedService: "레이어드 컷",
  selectedDesigner: "수아 디자이너",
  selectedSlot: "4월 29일 화요일 · 오전 10:30",
};

export const bookingFlowStore = new Store<BookingFlowState>(DEFAULT_STATE);

function persist(next: BookingFlowState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        step: next.step,
        selectedService: next.selectedService,
        selectedDesigner: next.selectedDesigner,
        selectedSlot: next.selectedSlot,
      })
    );
  } catch {
    /* ignore */
  }
}

function setState(next: BookingFlowState) {
  bookingFlowStore.setState(next);
  persist(next);
}

export const bookingFlowActions = {
  hydrate() {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        bookingFlowStore.setState((prev) => ({ ...prev, hydrated: true }));
        return;
      }

      const parsed = JSON.parse(stored) as Partial<BookingFlowState>;
      bookingFlowStore.setState({
        hydrated: true,
        step: parsed.step ?? DEFAULT_STATE.step,
        selectedService: parsed.selectedService ?? DEFAULT_STATE.selectedService,
        selectedDesigner: parsed.selectedDesigner ?? DEFAULT_STATE.selectedDesigner,
        selectedSlot: parsed.selectedSlot ?? DEFAULT_STATE.selectedSlot,
      });
    } catch {
      bookingFlowStore.setState((prev) => ({ ...prev, hydrated: true }));
    }
  },

  setStep(step: BookingStepKey) {
    const next = { ...bookingFlowStore.state, hydrated: true, step };
    setState(next);
  },

  setSelectedService(selectedService: string) {
    const next = { ...bookingFlowStore.state, hydrated: true, selectedService };
    setState(next);
  },

  setSelectedDesigner(selectedDesigner: string) {
    const next = { ...bookingFlowStore.state, hydrated: true, selectedDesigner };
    setState(next);
  },

  setSelectedSlot(selectedSlot: string) {
    const next = { ...bookingFlowStore.state, hydrated: true, selectedSlot };
    setState(next);
  },

  reset() {
    bookingFlowStore.setState({ ...DEFAULT_STATE, hydrated: true });
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

export function useBookingFlow() {
  return useStore(bookingFlowStore);
}
