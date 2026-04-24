export type ReservationSlotStatus = "AVAILABLE" | "REQUESTED" | "RESERVED" | "BLOCKED";

export type AvailableStaff = {
  id: number;
  name: string;
};

export type ReservationSlot = {
  slotId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  unitMinutes: number;
  occupiedUnitCount: number;
  status: ReservationSlotStatus;
  selectable: boolean;
  availableStaff: AvailableStaff[];
  reason: string;
};
