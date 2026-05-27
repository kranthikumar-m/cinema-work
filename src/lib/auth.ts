import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  countUserRecords,
  countUserRecordsByRole,
  createPasswordResetTokenRecord,
  createSessionRecord,
  createUserRecord,
  deleteSessionRecordByTokenHash,
  deleteSessionRecordsForUser,
  deleteUserRecord,
  getPasswordResetTokenRecordByHash,
  getSessionUserRecordByTokenHash,
  getUserRecordByEmail,
  getUserRecordById,
  getUserRecordByIdentifier,
  listUserRecords,
  markPasswordResetTokenRecordUsed,
  prunePasswordResetTokenRecords,
  updateUserRecord,
} from "@/lib/database";
import {
  PASSWORD_RESET_TTL_MS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/auth-config";
import { env, requireEnvVar } from "@/lib/env";
import type { ManageableUserRole } from "@/types/admin";
import type {
  AuthUser,
  PasswordResetTokenRecord,
  StoredUserRole,
} from "@/types/auth";

const PASSWORD_KEY_BYTES = 64;

interface UserRow {
  id: number;
  name: string | null;
  email: string;
  password_hash: string;
  role: StoredUserRole;
  image: string | null;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SessionUserRow extends UserRow {
  expires_at: string;
}

interface PasswordResetTokenRow {
  id: number;
  user_id: number;
  expires_at: string;
  created_at: string;
  used_at: string | null;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeStoredRole(role: StoredUserRole): "admin" | "user" {
  return role === "admin" || role === "editor" ? "admin" : "user";
}

function toStoredRole(role: ManageableUserRole): StoredUserRole {
  return role === "admin" ? "admin" : "viewer";
}

function displayNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim() || "User";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((chunk) => chunk[0]?.toUpperCase() + chunk.slice(1))
    .join(" ");
}

function mapUser(row: UserRow | SessionUserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: normalizeStoredRole(row.role),
    storedRole: row.role,
    image: row.image,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

function mapPasswordResetToken(row: PasswordResetTokenRow): PasswordResetTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    usedAt: row.used_at,
  };
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_KEY_BYTES).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, expectedHash.length / 2);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  return (
    derivedHash.length === expectedBuffer.length &&
    timingSafeEqual(derivedHash, expectedBuffer)
  );
}

function hashOpaqueToken(token: string) {
  return createHmac("sha256", requireEnvVar("AUTH_SECRET"))
    .update(token)
    .digest("hex");
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  return password.length >= 8;
}

async function findUserRowByEmail(email: string) {
  return getUserRecordByEmail(email);
}

async function findUserRowByIdentifier(identifier: string) {
  return getUserRecordByIdentifier(identifier);
}

async function findUserRowById(userId: number) {
  return getUserRecordById(userId);
}

async function invalidateSessionsForUser(userId: number) {
  await deleteSessionRecordsForUser(userId);
}

async function deleteExpiredPasswordResetTokens() {
  await prunePasswordResetTokenRecords(nowIso());
}

export function userHasAdminAccess(role: StoredUserRole) {
  return role === "admin" || role === "editor";
}

export function userCanManageUsers(role: StoredUserRole) {
  return role === "admin";
}

export function adminCanEditBackdrops(role: StoredUserRole) {
  return userHasAdminAccess(role);
}

export async function ensureBootstrapAdminUser() {
  const totalUsers = await countUserRecords();

  if (totalUsers > 0) {
    return;
  }

  if (!env.ADMIN_BOOTSTRAP_EMAIL || !env.ADMIN_BOOTSTRAP_PASSWORD) {
    return;
  }

  const normalizedEmail = env.ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase();
  const timestamp = nowIso();

  await createUserRecord({
    name: displayNameFromEmail(normalizedEmail),
    email: normalizedEmail,
    passwordHash: hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD),
    role: "admin",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function registerUser(input: {
  name?: string;
  email: string;
  password: string;
}) {
  await ensureBootstrapAdminUser();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedName = input.name?.trim() || displayNameFromEmail(normalizedEmail);

  if (!validateEmail(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  if (!validatePassword(input.password)) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await findUserRowByEmail(normalizedEmail);

  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const timestamp = nowIso();
  const user = await createUserRecord({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    role: "viewer",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  if (!user) {
    throw new Error("Unable to create account.");
  }

  return mapUser(user);
}

export async function authenticateUser(identifier: string, password: string) {
  await ensureBootstrapAdminUser();
  const user = await findUserRowByIdentifier(identifier);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  if (!user.is_active) {
    throw new Error("This account has been disabled.");
  }

  return mapUser(user);
}

export async function getUserById(userId: number) {
  const user = await findUserRowById(userId);
  return user ? mapUser(user) : null;
}

export async function getUserByEmail(email: string) {
  const user = await findUserRowByEmail(email);
  return user ? mapUser(user) : null;
}

export async function listUsers(filters?: {
  query?: string;
  role?: ManageableUserRole | "all";
  status?: "active" | "disabled" | "all";
}) {
  await ensureBootstrapAdminUser();
  let users = await listUserRecords();

  if (filters?.query?.trim()) {
    const query = filters.query.trim().toLowerCase();
    users = users.filter((user) => {
      const name = user.name?.toLowerCase() ?? "";
      const email = user.email.toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }

  if (filters?.role === "admin") {
    users = users.filter((user) => user.role === "admin" || user.role === "editor");
  } else if (filters?.role === "user") {
    users = users.filter((user) => user.role === "viewer");
  }

  if (filters?.status === "active") {
    users = users.filter((user) => Boolean(user.is_active));
  } else if (filters?.status === "disabled") {
    users = users.filter((user) => !user.is_active);
  }

  return users.map(mapUser);
}

export async function createUserByAdmin(input: {
  name?: string;
  email: string;
  password: string;
  role: ManageableUserRole;
  isActive?: boolean;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedName = input.name?.trim() || displayNameFromEmail(normalizedEmail);

  if (!validateEmail(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  if (!validatePassword(input.password)) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await findUserRowByEmail(normalizedEmail);

  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const timestamp = nowIso();
  const user = await createUserRecord({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    role: toStoredRole(input.role),
    isActive: input.isActive !== false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  if (!user) {
    throw new Error("Unable to create user.");
  }

  return mapUser(user);
}

export async function updateUserByAdmin(
  userId: number,
  input: {
    name?: string;
    role?: ManageableUserRole;
    isActive?: boolean;
    image?: string | null;
  }
) {
  const existing = await findUserRowById(userId);

  if (!existing) {
    throw new Error("User not found.");
  }

  const nextStoredRole =
    input.role !== undefined ? toStoredRole(input.role) : existing.role;
  const nextIsActive =
    input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.is_active;

  if (existing.role === "admin" && nextStoredRole !== "admin") {
    const adminCount = await countUserRecordsByRole("admin");

    if (adminCount <= 1) {
      throw new Error("At least one admin account must remain.");
    }
  }

  const user = await updateUserRecord(userId, {
    name: input.name?.trim() || existing.name,
    role: nextStoredRole,
    isActive: Boolean(nextIsActive),
    image: input.image === undefined ? existing.image : input.image,
    updatedAt: nowIso(),
  });

  if (!nextIsActive) {
    await invalidateSessionsForUser(userId);
  }

  if (!user) {
    throw new Error("Unable to update user.");
  }

  return mapUser(user);
}

export async function deleteUserByAdmin(userId: number) {
  const existing = await findUserRowById(userId);

  if (!existing) {
    throw new Error("User not found.");
  }

  if (existing.role === "admin") {
    const adminCount = await countUserRecordsByRole("admin");

    if (adminCount <= 1) {
      throw new Error("At least one admin account must remain.");
    }
  }

  await deleteUserRecord(userId);
}

export async function updateCurrentUserProfile(
  userId: number,
  input: { name?: string; image?: string | null }
) {
  const existing = await findUserRowById(userId);

  if (!existing) {
    throw new Error("User not found.");
  }

  const user = await updateUserRecord(userId, {
    name: input.name?.trim() || existing.name,
    image: input.image === undefined ? existing.image : input.image,
    updatedAt: nowIso(),
  });

  if (!user) {
    throw new Error("Unable to update profile.");
  }

  return mapUser(user);
}

export async function createSessionForUser(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const timestamp = nowIso();

  await createSessionRecord({
    userId,
    tokenHash,
    expiresAt,
    createdAt: timestamp,
  });
  await updateUserRecord(userId, {
    lastLoginAt: timestamp,
    updatedAt: timestamp,
  });

  return { token, expiresAt };
}

export async function deleteSession(token: string | null | undefined) {
  if (!token || !env.AUTH_SECRET || !env.DATABASE_URL) {
    return;
  }

  await deleteSessionRecordByTokenHash(hashOpaqueToken(token));
}

async function readSessionUser(token: string | null | undefined) {
  if (!token || !env.AUTH_SECRET || !env.DATABASE_URL) {
    return null;
  }

  await ensureBootstrapAdminUser();
  const row = await getSessionUserRecordByTokenHash(hashOpaqueToken(token));

  if (!row) {
    return null;
  }

  if (new Date(row.expires_at).getTime() <= Date.now() || !row.is_active) {
    await deleteSession(token);
    return null;
  }

  return mapUser(row);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return readSessionUser(token);
}

export async function getCurrentAdminUser() {
  const user = await getCurrentUser();

  if (!user || !userHasAdminAccess(user.storedRole)) {
    return null;
  }

  return user;
}

function buildLoginRedirect(nextPath?: string) {
  if (!nextPath) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export async function requireAuthenticatedUser(nextPath?: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(buildLoginRedirect(nextPath));
  }

  return user;
}

export async function requireAdminUser(nextPath = "/admin") {
  const user = await requireAuthenticatedUser(nextPath);

  if (!userHasAdminAccess(user.storedRole)) {
    redirect("/unauthorized");
  }

  return user;
}

export async function requireLoggedOutUser() {
  const user = await getCurrentUser();

  if (user) {
    redirect(userHasAdminAccess(user.storedRole) ? "/admin" : "/account");
  }
}

export async function requestPasswordReset(email: string) {
  await ensureBootstrapAdminUser();
  await deleteExpiredPasswordResetTokens();

  const user = await findUserRowByEmail(email);

  if (!user || !user.is_active) {
    return { resetUrl: null, token: null };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();
  const timestamp = nowIso();

  await createPasswordResetTokenRecord({
    userId: user.id,
    tokenHash,
    expiresAt,
    createdAt: timestamp,
  });

  const resetUrl = `${env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;

  return {
    token,
    resetUrl,
  };
}

export async function verifyPasswordResetToken(token: string) {
  await deleteExpiredPasswordResetTokens();
  const row = await getPasswordResetTokenRecordByHash(hashOpaqueToken(token));

  if (!row || row.used_at || new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return mapPasswordResetToken(row);
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (!validatePassword(newPassword)) {
    throw new Error("Password must be at least 8 characters.");
  }

  const resetToken = await verifyPasswordResetToken(token);

  if (!resetToken) {
    throw new Error("This reset link is invalid or has expired.");
  }

  const timestamp = nowIso();

  await updateUserRecord(resetToken.userId, {
    passwordHash: hashPassword(newPassword),
    updatedAt: timestamp,
  });
  await markPasswordResetTokenRecordUsed(resetToken.id, timestamp);

  await invalidateSessionsForUser(resetToken.userId);
}

export async function listAdminUsers() {
  return listUsers();
}

export async function createAdminUser(input: {
  name?: string;
  email: string;
  password: string;
  role: ManageableUserRole | StoredUserRole;
  isActive?: boolean;
}) {
  const role =
    input.role === "admin" || input.role === "editor" ? "admin" : "user";

  return createUserByAdmin({
    name: input.name,
    email: input.email,
    password: input.password,
    role,
    isActive: input.isActive,
  });
}

export async function updateAdminUserRole(
  userId: number,
  role: ManageableUserRole | StoredUserRole
) {
  const nextRole = role === "admin" || role === "editor" ? "admin" : "user";
  await updateUserByAdmin(userId, { role: nextRole });
  return listUsers();
}

export async function authenticateAdminUser(email: string, password: string) {
  const user = await authenticateUser(email, password);

  if (!user || !userHasAdminAccess(user.storedRole)) {
    return null;
  }

  return user;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
