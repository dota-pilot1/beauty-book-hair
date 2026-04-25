export type BeautyServiceTargetGender = "ALL" | "WOMEN" | "MEN";

export type BeautyServiceCategory = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  visible: boolean;
  displayOrder: number;
  createdAt: string;
};

export type BeautyService = {
  id: number;
  code: string;
  name: string;
  category: BeautyServiceCategory;
  description?: string | null;
  durationMinutes: number;
  price: number;
  targetGender: BeautyServiceTargetGender;
  visible: boolean;
  displayOrder: number;
  imageUrls: string[];
  createdAt: string;
  hasActiveReservations: boolean;
};
