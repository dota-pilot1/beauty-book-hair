export type ReservationSlotStatus = "AVAILABLE" | "REQUESTED" | "RESERVED" | "BLOCKED";

export type ReservationStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "CANCELLED_BY_CUSTOMER"
  | "CANCELLED_BY_ADMIN"
  | "COMPLETED"
  | "NO_SHOW";

export type ReservationItem = {
  id: number | null;
  beautyServiceId: number;
  beautyServiceName: string;
  durationMinutes: number;
  price: number | string;
  displayOrder: number;
};

export type Reservation = {
  id: number;
  /** 비-관리자에겐 마스킹되어 null. 본인 예약은 /me 에서만 채워짐. */
  customerName: string | null;
  customerPhone: string | null;
  staffId: number;
  staffName: string;
  beautyServiceId: number;
  beautyServiceName: string;
  items: ReservationItem[];
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  customerMemo: string | null;
  adminMemo: string | null;
  createdAt: string;
  deletedAt: string | null;
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
