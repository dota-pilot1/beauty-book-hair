export type UserRole = "ROLE_USER" | "ROLE_ADMIN";

export type User = {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  createdAt?: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  username: string;
};

export type SignupResponse = User;

export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSec: number;
  user: User;
};
