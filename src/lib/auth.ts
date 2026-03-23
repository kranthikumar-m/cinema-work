import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireDatabase } from "@/lib/database";
import { env, requireEnvVar } from "@/lib/env";
import { ADMIN_ROLES, type AdminRole, type AdminSessionUser, type AdminUser } from "@/types/admin";

const SESSION_COOKIE_NAME = "tcu_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_KEY_BYTES = 64;

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

interface SessionUserRow {
  id: number;
  email: string;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

function nowIso() {
  return new Date().toISOString();
}

function mapUser(row: SessionUserRow | UserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

function hashSessionToken(token: string) {
  return createHmac("sha256", requireEnvVar("AUTH_SECRET"))
    .update(token)
    .digest("hex");
}

function isRole(value: string): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function adminCanEditBackdrops(role: AdminRole) {
  return role === "admin" || role === "editor";
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

  const timestamp = nowIso();
  database
    .prepare(
      `
        INSERT INTO users (email, password_hash, role, created_at, updated_at)
        VALUES (?, ?, 'admin', ?, ?)
      `
    )
    .run(
      env.ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase(),
      hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD),
      timestamp,
      timestamp
    );
}

export async function authenticateAdminUser(email: string, password: string) {
  await ensureBootstrapAdminUser();
  const database = requireDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  const user = database
    .prepare(
      `
        SELECT id, email, password_hash, role, created_at, updated_at
        FROM users
        WHERE email = ?
      `
    )
    .get<UserRow>(normalizedEmail);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  return mapUser(user);
}

export async function listAdminUsers() {
  await ensureBootstrapAdminUser();
  const database = requireDatabase();
  return database
    .prepare(
      `
        SELECT id, email, role, created_at, updated_at
        FROM users
        ORDER BY datetime(created_at) ASC
      `
    )
    .all<SessionUserRow>()
    .map(mapUser);
}

export async function createAdminUser(input: {
  email: string;
  password: string;
  role: AdminRole;
}) {
  const database = requireDatabase();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (!isRole(input.role)) {
    throw new Error("Invalid role.");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = database
    .prepare("SELECT id FROM users WHERE email = ?")
    .get<{ id: number }>(normalizedEmail);

  if (existing) {
    throw new Error("A user with that email already exists.");
  }

  const timestamp = nowIso();
  database
    .prepare(
      `
        INSERT INTO users (email, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(
      normalizedEmail,
      hashPassword(input.password),
      input.role,
      timestamp,
      timestamp
    );

  return listAdminUsers();
}

export async function updateAdminUserRole(userId: number, role: AdminRole) {
  const database = requireDatabase();

  if (!isRole(role)) {
    throw new Error("Invalid role.");
  }

  const user = database
    .prepare("SELECT id, role FROM users WHERE id = ?")
    .get<{ id: number; role: AdminRole }>(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.role === "admin" && role !== "admin") {
    const adminCount = database
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
      .get<{ count: number }>()?.count ?? 0;

    if (adminCount <= 1) {
      throw new Error("At least one admin account must remain.");
    }
  }

  database
    .prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
    .run(role, nowIso(), userId);

  return listAdminUsers();
}

export async function createSessionForUser(userId: number) {
  const database = requireDatabase();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  database
    .prepare(
      `
        INSERT INTO sessions (user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `
    )
    .run(userId, tokenHash, expiresAt, nowIso());

  return { token, expiresAt };
}

export async function deleteSession(token: string | null | undefined) {
  if (!token || !env.AUTH_SECRET || !env.DATABASE_URL) {
    return;
  }

  const database = requireDatabase();
  database
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .run(hashSessionToken(token));
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
        SELECT users.id, users.email, users.role, users.created_at, users.updated_at, sessions.expires_at
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ?
      `
    )
    .get<(SessionUserRow & { expires_at: string })>(hashSessionToken(token));

  if (!row) {
    return null;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await deleteSession(token);
    return null;
  }

  return mapUser(row);
}

export async function getCurrentAdminUser(): Promise<AdminSessionUser | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return readSessionUser(token);
}

export async function requireAdminUser(allowedRoles: AdminRole[] = ["admin", "editor"]) {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }

  return user;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
