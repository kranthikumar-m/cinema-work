export const STORED_USER_ROLES = ["admin", "editor", "viewer"] as const;

export type StoredUserRole = (typeof STORED_USER_ROLES)[number];
export type UserRole = "admin" | "user";

export interface AuthUser {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  storedRole: StoredUserRole;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface PasswordResetTokenRecord {
  id: number;
  userId: number;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
}
