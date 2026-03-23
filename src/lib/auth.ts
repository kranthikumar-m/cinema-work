import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireDatabase } from "@/lib/database";
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
  const database = requireDatabase();
  return (
    database
      .prepare(
        `
          SELECT id, name, email, password_hash, role, image, is_active, last_login_at, created_at, updated_at
          FROM users
          WHERE email = ?
        `
      )
      .get<UserRow>(email.trim().toLowerCase()) ?? null
  );
}

async function findUserRowById(userId: number) {
  const database = requireDatabase();
  return (
    database
      .prepare(
        `
          SELECT id, name, email, password_hash, role, image, is_active, last_login_at, created_at, updated_at
          FROM users
          WHERE id = ?
        `
      )
      .get<UserRow>(userId) ?? null
  );
}

async function invalidateSessionsForUser(userId: number) {
  const database = requireDatabase();
  database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

async function deleteExpiredPasswordResetTokens() {
  const database = requireDatabase();
  database
    .prepare(
      "DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL OR datetime(expires_at) <= datetime(?)"
    )
    .run(nowIso());
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
  const database = requireDatabase();
  const totalUsers = database
    .prepare("SELECT COUNT(*) as count FROM users")
    .get<{ count: number }>()?.count ?? 0;

  if (totalUsers > 0) {
    return;
  }

  if (!env.ADMIN_BOOTSTRAP_EMAIL || !env.ADMIN_BOOTSTRAP_PASSWORD) {
    return;
  }

  const normalizedEmail = env.ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase();
  const timestamp = nowIso();

  database
    .prepare(
      `
        INSERT INTO users (
          name,
          email,
          password_hash,
          role,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, 'admin', 1, ?, ?)
      `
    )
    .run(
      displayNameFromEmail(normalizedEmail),
      normalizedEmail,
      hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD),
      timestamp,
      timestamp
    );
}

export async function registerUser(input: {
  name?: string;
  email: string;
  password: string;
}) {
  await ensureBootstrapAdminUser();
  const database = requireDatabase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedName = input.name?.trim() || displayNameFromEmail(normalizedEmail);

  if (!validateEmail(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  if (!validatePassword(input.password)) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = database
    .prepare("SELECT id FROM users WHERE email = ?")
    .get<{ id: number }>(normalizedEmail);

  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const timestamp = nowIso();
  const result = database
    .prepare(
      `
        INSERT INTO users (
          name,
          email,
          password_hash,
          role,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, 'viewer', 1, ?, ?)
      `
    )
    .run(
      normalizedName,
      normalizedEmail,
      hashPassword(input.password),
      timestamp,
      timestamp
    );

  const user = await findUserRowById(Number(result.lastInsertRowid));

  if (!user) {
    throw new Error("Unable to create account.");
  }

  return mapUser(user);
}

export async function authenticateUser(email: string, password: string) {
  await ensureBootstrapAdminUser();
  const user = await findUserRowByEmail(email);

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
  const database = requireDatabase();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters?.query?.trim()) {
    clauses.push("(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)");
    const pattern = `%${filters.query.trim().toLowerCase()}%`;
    params.push(pattern, pattern);
  }

  if (filters?.role === "admin") {
    clauses.push("role IN ('admin', 'editor')");
  } else if (filters?.role === "user") {
    clauses.push("role = 'viewer'");
  }

  if (filters?.status === "active") {
    clauses.push("is_active = 1");
  } else if (filters?.status === "disabled") {
    clauses.push("is_active = 0");
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const users = database
    .prepare(
      `
        SELECT id, name, email, password_hash, role, image, is_active, last_login_at, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY datetime(created_at) DESC
      `
    )
    .all<UserRow>(...params);

  return users.map(mapUser);
}

export async function createUserByAdmin(input: {
  name?: string;
  email: string;
  password: string;
  role: ManageableUserRole;
  isActive?: boolean;
}) {
  const database = requireDatabase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedName = input.name?.trim() || displayNameFromEmail(normalizedEmail);

  if (!validateEmail(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  if (!validatePassword(input.password)) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = database
    .prepare("SELECT id FROM users WHERE email = ?")
    .get<{ id: number }>(normalizedEmail);

  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const timestamp = nowIso();
  const result = database
    .prepare(
      `
        INSERT INTO users (
          name,
          email,
          password_hash,
          role,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      normalizedName,
      normalizedEmail,
      hashPassword(input.password),
      toStoredRole(input.role),
      input.isActive === false ? 0 : 1,
      timestamp,
      timestamp
    );

  const user = await findUserRowById(Number(result.lastInsertRowid));

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
  const database = requireDatabase();
  const existing = await findUserRowById(userId);

  if (!existing) {
    throw new Error("User not found.");
  }

  const nextStoredRole =
    input.role !== undefined ? toStoredRole(input.role) : existing.role;
  const nextIsActive =
    input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.is_active;

  if (existing.role === "admin" && nextStoredRole !== "admin") {
    const adminCount = database
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
      .get<{ count: number }>()?.count ?? 0;

    if (adminCount <= 1) {
      throw new Error("At least one admin account must remain.");
    }
  }

  database
    .prepare(
      `
        UPDATE users
        SET
          name = ?,
          role = ?,
          is_active = ?,
          image = ?,
          updated_at = ?
        WHERE id = ?
      `
    )
    .run(
      input.name?.trim() || existing.name,
      nextStoredRole,
      nextIsActive,
      input.image === undefined ? existing.image : input.image,
      nowIso(),
      userId
    );

  if (!nextIsActive) {
    await invalidateSessionsForUser(userId);
  }

  const user = await findUserRowById(userId);

  if (!user) {
    throw new Error("Unable to update user.");
  }

  return mapUser(user);
}

export async function deleteUserByAdmin(userId: number) {
  const database = requireDatabase();
  const existing = await findUserRowById(userId);

  if (!existing) {
    throw new Error("User not found.");
  }

  if (existing.role === "admin") {
    const adminCount = database
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
      .get<{ count: number }>()?.count ?? 0;

    if (adminCount <= 1) {
      throw new Error("At least one admin account must remain.");
    }
  }

  database.prepare("DELETE FROM users WHERE id = ?").run(userId);
}

export async function updateCurrentUserProfile(
  userId: number,
  input: { name?: string; image?: string | null }
) {
  const database = requireDatabase();
  const existing = await findUserRowById(userId);

  if (!existing) {
    throw new Error("User not found.");
  }

  database
    .prepare(
      `
        UPDATE users
        SET
          name = ?,
          image = ?,
          updated_at = ?
        WHERE id = ?
      `
    )
    .run(
      input.name?.trim() || existing.name,
      input.image === undefined ? existing.image : input.image,
      nowIso(),
      userId
    );

  const user = await findUserRowById(userId);

  if (!user) {
    throw new Error("Unable to update profile.");
  }

  return mapUser(user);
}

export async function createSessionForUser(userId: number) {
  const database = requireDatabase();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const timestamp = nowIso();

  database
    .prepare(
      `
        INSERT INTO sessions (user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `
    )
    .run(userId, tokenHash, expiresAt, timestamp);

  database
    .prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?")
    .run(timestamp, timestamp, userId);

  return { token, expiresAt };
}

export async function deleteSession(token: string | null | undefined) {
  if (!token || !env.AUTH_SECRET || !env.DATABASE_URL) {
    return;
  }

  const database = requireDatabase();
  database
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .run(hashOpaqueToken(token));
}

async function readSessionUser(token: string | null | undefined) {
  if (!token || !env.AUTH_SECRET || !env.DATABASE_URL) {
    return null;
  }

  await ensureBootstrapAdminUser();
  const database = requireDatabase();
  const row = database
    .prepare(
      `
        SELECT
          users.id,
          users.name,
          users.email,
          users.password_hash,
          users.role,
          users.image,
          users.is_active,
          users.last_login_at,
          users.created_at,
          users.updated_at,
          sessions.expires_at
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ?
      `
    )
    .get<SessionUserRow>(hashOpaqueToken(token));

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

  const database = requireDatabase();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();
  const timestamp = nowIso();

  database
    .prepare(
      `
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `
    )
    .run(user.id, tokenHash, expiresAt, timestamp);

  const resetUrl = `${env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;

  return {
    token,
    resetUrl,
  };
}

export async function verifyPasswordResetToken(token: string) {
  await deleteExpiredPasswordResetTokens();
  const database = requireDatabase();
  const row = database
    .prepare(
      `
        SELECT id, user_id, expires_at, created_at, used_at
        FROM password_reset_tokens
        WHERE token_hash = ?
      `
    )
    .get<PasswordResetTokenRow>(hashOpaqueToken(token));

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

  const database = requireDatabase();
  const timestamp = nowIso();

  database
    .prepare(
      `
        UPDATE users
        SET password_hash = ?, updated_at = ?
        WHERE id = ?
      `
    )
    .run(hashPassword(newPassword), timestamp, resetToken.userId);

  database
    .prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?")
    .run(timestamp, resetToken.id);

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
