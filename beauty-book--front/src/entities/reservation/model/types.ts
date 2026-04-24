export type ReservationSlotStatus = "AVAILABLE" | "REQUESTED" | "RESERVED" | "BLOCKED";

export type ReservationStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "CANCELLED_BY_CUSTOMER"
  | "CANCELLED_BY_ADMIN"
  | "COMPLETED"
  | "NO_SHOW";

export type Reservation = {
  id: number;
  customerName: string;
  customerPhone: string;
  staffId: number;
  staffName: string;
  beautyServiceId: number;
  beautyServiceName: string;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  customerMemo: string | null;
  adminMemo: string | null;
  createdAt: string;
};

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
