"use client";

import { Store, useStore } from "@tanstack/react-store";

export type BookingStepKey = "service" | "designer" | "schedule";

export type BookingFlowState = {
  hydrated: boolean;
  step: BookingStepKey;
  selectedServiceIds: number[];
  selectedDate: string;
  selectedDesignerId: number | null;
  selectedDesigner: string;
  selectedStartAt: string | null;
  selectedEndAt: string | null;
  selectedSlot: string;
  selectedSlotAvailableDesigners: Array<{ id: number; name: string }>;
  selectedOccupiedUnitCount: number;
};

const STORAGE_KEY = "booking-flow-draft";

const DEFAULT_STATE: BookingFlowState = {
  hydrated: false,
  step: "service",
  selectedServiceIds: [],
  selectedDate: formatDateInput(new Date()),
  selectedDesignerId: null,
  selectedDesigner: "선택 전",
  selectedStartAt: null,
  selectedEndAt: null,
  selectedSlot: "선택 전",
  selectedSlotAvailableDesigners: [],
  selectedOccupiedUnitCount: 0,
};

export const bookingFlowStore = new Store<BookingFlowState>(DEFAULT_STATE);

function persist(next: BookingFlowState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        step: next.step,
        selectedServiceIds: next.selectedServiceIds,
        selectedDate: next.selectedDate,
        selectedDesignerId: next.selectedDesignerId,
        selectedDesigner: next.selectedDesigner,
        selectedStartAt: next.selectedStartAt,
        selectedEndAt: next.selectedEndAt,
        selectedSlot: next.selectedSlot,
        selectedSlotAvailableDesigners: next.selectedSlotAvailableDesigners,
        selectedOccupiedUnitCount: next.selectedOccupiedUnitCount,
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

function clearScheduleAndDesigner(prev: BookingFlowState): BookingFlowState {
  return {
    ...prev,
    selectedDesignerId: null,
    selectedDesigner: "선택 전",
    selectedStartAt: null,
    selectedEndAt: null,
    selectedSlot: "선택 전",
    selectedSlotAvailableDesigners: [],
    selectedOccupiedUnitCount: 0,
  };
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

      const parsed = JSON.parse(stored) as Partial<BookingFlowState> & {
        selectedService?: string;
        selectedServiceId?: number | null;
      };

      const restoredIds = Array.isArray(parsed.selectedServiceIds)
        ? parsed.selectedServiceIds.filter((v): v is number => typeof v === "number")
        : parsed.selectedServiceId != null
          ? [parsed.selectedServiceId]
          : DEFAULT_STATE.selectedServiceIds;

      bookingFlowStore.setState({
        hydrated: true,
        step: parsed.step ?? DEFAULT_STATE.step,
        selectedServiceIds: restoredIds,
        selectedDate: parsed.selectedDate ?? DEFAULT_STATE.selectedDate,
        selectedDesignerId: parsed.selectedDesignerId ?? DEFAULT_STATE.selectedDesignerId,
        selectedDesigner: parsed.selectedDesigner ?? DEFAULT_STATE.selectedDesigner,
        selectedStartAt: parsed.selectedStartAt ?? DEFAULT_STATE.selectedStartAt,
        selectedEndAt: parsed.selectedEndAt ?? DEFAULT_STATE.selectedEndAt,
        selectedSlot: parsed.selectedSlot ?? DEFAULT_STATE.selectedSlot,
        selectedSlotAvailableDesigners:
          parsed.selectedSlotAvailableDesigners ?? DEFAULT_STATE.selectedSlotAvailableDesigners,
        selectedOccupiedUnitCount:
          parsed.selectedOccupiedUnitCount ?? DEFAULT_STATE.selectedOccupiedUnitCount,
      });
    } catch {
      bookingFlowStore.setState((prev) => ({ ...prev, hydrated: true }));
    }
  },

  setStep(step: BookingStepKey) {
    setState({ ...bookingFlowStore.state, hydrated: true, step });
  },

  toggleService(serviceId: number) {
    const current = bookingFlowStore.state.selectedServiceIds;
    const exists = current.includes(serviceId);
    const next = exists
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];
    setState({
      ...clearScheduleAndDesigner({ ...bookingFlowStore.state, hydrated: true }),
      selectedServiceIds: next,
    });
  },

  setSelectedServiceIds(selectedServiceIds: number[]) {
    setState({
      ...clearScheduleAndDesigner({ ...bookingFlowStore.state, hydrated: true }),
      selectedServiceIds,
    });
  },

  clearServices() {
    setState({
      ...clearScheduleAndDesigner({ ...bookingFlowStore.state, hydrated: true }),
      selectedServiceIds: [],
    });
  },

  promoteToMain(serviceId: number) {
    const current = bookingFlowStore.state.selectedServiceIds;
    if (!current.includes(serviceId) || current[0] === serviceId) return;
    const next = [serviceId, ...current.filter((id) => id !== serviceId)];
    setState({
      ...clearScheduleAndDesigner({ ...bookingFlowStore.state, hydrated: true }),
      selectedServiceIds: next,
    });
  },

  setSelectedDate(selectedDate: string) {
    setState({
      ...clearScheduleAndDesigner({ ...bookingFlowStore.state, hydrated: true }),
      selectedDate,
    });
  },

  setSelectedDesigner(selectedDesignerId: number, selectedDesigner: string) {
    setState({
      ...bookingFlowStore.state,
      hydrated: true,
      selectedDesignerId,
      selectedDesigner,
      selectedStartAt: null,
      selectedEndAt: null,
      selectedSlot: "선택 전",
      selectedSlotAvailableDesigners: [],
      selectedOccupiedUnitCount: 0,
    });
  },

  setSelectedSlot(slot: {
    label: string;
    startAt: string;
    endAt: string;
    availableStaff: Array<{ id: number; name: string }>;
    occupiedUnitCount: number;
  }) {
    const autoDesigner = slot.availableStaff.length === 1 ? slot.availableStaff[0] : null;
    const currentDesignerStillAvailable =
      bookingFlowStore.state.selectedDesignerId != null &&
      slot.availableStaff.some((s) => s.id === bookingFlowStore.state.selectedDesignerId);

    setState({
      ...bookingFlowStore.state,
      hydrated: true,
      selectedStartAt: slot.startAt,
      selectedEndAt: slot.endAt,
      selectedSlot: slot.label,
      selectedSlotAvailableDesigners: slot.availableStaff,
      selectedOccupiedUnitCount: slot.occupiedUnitCount,
      selectedDesignerId: currentDesignerStillAvailable
        ? bookingFlowStore.state.selectedDesignerId
        : autoDesigner?.id ?? null,
      selectedDesigner: currentDesignerStillAvailable
        ? bookingFlowStore.state.selectedDesigner
        : autoDesigner?.name ?? "선택 전",
    });
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

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
