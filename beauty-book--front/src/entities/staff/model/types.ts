export type StaffRole = "DESIGNER" | "STAFF" | "DESK";

export type Staff = {
  id: number;
  name: string;
  role: StaffRole;
  profileImageUrl: string | null;
  introduction: string | null;
  active: boolean;
  displayOrder: number;
  createdAt: string;
};
