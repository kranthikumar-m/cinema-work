import "server-only";
import fs from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";
import type { StoredUserRole } from "@/types/auth";

type BetterSqlite3Database = {
  exec(sql: string): void;
  pragma(statement: string): void;
  prepare(sql: string): {
    get<T = unknown>(...params: unknown[]): T | undefined;
    all<T = unknown>(...params: unknown[]): T[];
    run(...params: unknown[]): { lastInsertRowid: number | bigint };
  };
};

declare function require(moduleName: string): unknown;

export interface DatabaseUserRow {
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

export interface DatabaseSessionUserRow extends DatabaseUserRow {
  expires_at: string;
}

export interface DatabasePasswordResetTokenRow {
  id: number;
  user_id: number;
  expires_at: string;
  created_at: string;
  used_at: string | null;
}

export interface DatabaseBackdropOverrideRow {
  movie_id: number;
  selected_backdrop_path: string;
  source: "tmdb";
  selected_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateUserRecordInput {
  name: string | null;
  email: string;
  passwordHash: string;
  role: StoredUserRole;
  isActive: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserRecordInput {
  name?: string | null;
  email?: string;
  passwordHash?: string;
  role?: StoredUserRole;
  image?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  updatedAt: string;
}

interface CreateSessionRecordInput {
  userId: number;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

interface CreatePasswordResetTokenRecordInput {
  userId: number;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

interface UpsertBackdropOverrideRecordInput {
  movieId: number;
  selectedBackdropPath: string;
  source: "tmdb";
  selectedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface StorageProvider {
  getUserByEmail(email: string): Promise<DatabaseUserRow | null>;
  getUserByIdentifier(identifier: string): Promise<DatabaseUserRow | null>;
  getUserById(userId: number): Promise<DatabaseUserRow | null>;
  listUsers(): Promise<DatabaseUserRow[]>;
  countUsers(): Promise<number>;
  countUsersByRole(role: StoredUserRole): Promise<number>;
  createUser(input: CreateUserRecordInput): Promise<DatabaseUserRow>;
  updateUser(userId: number, input: UpdateUserRecordInput): Promise<DatabaseUserRow | null>;
  deleteUser(userId: number): Promise<void>;
  deleteSessionsForUser(userId: number): Promise<void>;
  createSession(input: CreateSessionRecordInput): Promise<void>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
  getSessionUserByTokenHash(tokenHash: string): Promise<DatabaseSessionUserRow | null>;
  deleteUsedOrExpiredPasswordResetTokens(nowIso: string): Promise<void>;
  createPasswordResetToken(input: CreatePasswordResetTokenRecordInput): Promise<void>;
  getPasswordResetTokenByHash(tokenHash: string): Promise<DatabasePasswordResetTokenRow | null>;
  markPasswordResetTokenUsed(id: number, usedAt: string): Promise<void>;
  getBackdropOverride(movieId: number): Promise<DatabaseBackdropOverrideRow | null>;
  upsertBackdropOverride(
    input: UpsertBackdropOverrideRecordInput
  ): Promise<DatabaseBackdropOverrideRow | null>;
  deleteBackdropOverride(movieId: number): Promise<void>;
}

interface TableColumnInfo {
  name: string;
}

interface SupabaseErrorPayload {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
}

class SupabaseRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: string,
    readonly hint?: string
  ) {
    super(message);
    this.name = "SupabaseRequestError";
  }
}

let storageProvider: StorageProvider | null | undefined;

const USER_SELECT =
  "id,name,email,password_hash,role,image,is_active,last_login_at,created_at,updated_at";
const PASSWORD_RESET_TOKEN_SELECT = "id,user_id,expires_at,created_at,used_at";
const BACKDROP_OVERRIDE_SELECT =
  "movie_id,selected_backdrop_path,source,selected_by_user_id,created_at,updated_at";

function hasSupabaseProjectUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeSupabaseProjectUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, "");

  if (url.pathname === "/") {
    url.pathname = "";
  }

  return url.toString().replace(/\/$/, "");
}

function resolveDatabasePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      `Unsupported DATABASE_URL "${databaseUrl}". Use a file: URL for SQLite or your Supabase project URL, for example https://your-project-ref.supabase.co.`
    );
  }

  const rawPath = databaseUrl.slice("file:".length);

  if (!rawPath) {
    throw new Error("DATABASE_URL must include a file path after the file: prefix.");
  }

  return path.isAbsolute(rawPath)
    ? rawPath
    : path.join(process.cwd(), rawPath);
}

function initializeSqliteDatabase(database: BetterSqlite3Database) {
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
      image TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS movie_backdrop_overrides (
      movie_id INTEGER PRIMARY KEY,
      selected_backdrop_path TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'tmdb',
      selected_by_user_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (selected_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
  `);

  ensureColumn(database, "users", "name", "ALTER TABLE users ADD COLUMN name TEXT");
  ensureColumn(database, "users", "image", "ALTER TABLE users ADD COLUMN image TEXT");
  ensureColumn(
    database,
    "users",
    "is_active",
    "ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"
  );
  ensureColumn(
    database,
    "users",
    "last_login_at",
    "ALTER TABLE users ADD COLUMN last_login_at TEXT"
  );
}

function ensureColumn(
  database: BetterSqlite3Database,
  tableName: string,
  columnName: string,
  alterStatement: string
) {
  const columns =
    database
      .prepare(`PRAGMA table_info(${tableName})`)
      .all<TableColumnInfo>() ?? [];

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  database.exec(alterStatement);
}

function isSupabaseUniqueEmailError(error: unknown) {
  return (
    error instanceof SupabaseRequestError &&
    error.code === "23505" &&
    `${error.message} ${error.details ?? ""}`.toLowerCase().includes("email")
  );
}

function buildSqliteUserPatch(input: UpdateUserRecordInput) {
  const assignments: string[] = [];
  const values: unknown[] = [];

  if ("name" in input) {
    assignments.push("name = ?");
    values.push(input.name ?? null);
  }

  if ("email" in input) {
    assignments.push("email = ?");
    values.push(input.email);
  }

  if ("passwordHash" in input) {
    assignments.push("password_hash = ?");
    values.push(input.passwordHash);
  }

  if ("role" in input) {
    assignments.push("role = ?");
    values.push(input.role);
  }

  if ("image" in input) {
    assignments.push("image = ?");
    values.push(input.image ?? null);
  }

  if ("isActive" in input) {
    assignments.push("is_active = ?");
    values.push(input.isActive ? 1 : 0);
  }

  if ("lastLoginAt" in input) {
    assignments.push("last_login_at = ?");
    values.push(input.lastLoginAt ?? null);
  }

  assignments.push("updated_at = ?");
  values.push(input.updatedAt);

  return { assignments, values };
}

function buildSupabaseUserPatch(input: UpdateUserRecordInput) {
  const patch: Record<string, string | number | null> = {
    updated_at: input.updatedAt,
  };

  if ("name" in input) {
    patch.name = input.name ?? null;
  }

  if ("email" in input) {
    patch.email = input.email ?? null;
  }

  if ("passwordHash" in input) {
    patch.password_hash = input.passwordHash ?? null;
  }

  if ("role" in input) {
    patch.role = input.role ?? null;
  }

  if ("image" in input) {
    patch.image = input.image ?? null;
  }

  if ("isActive" in input) {
    patch.is_active = input.isActive ? 1 : 0;
  }

  if ("lastLoginAt" in input) {
    patch.last_login_at = input.lastLoginAt ?? null;
  }

  return patch;
}

function createSqliteStorageProvider(databaseUrl: string): StorageProvider {
  const databasePath = resolveDatabasePath(databaseUrl);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const BetterSqlite3 = require("better-sqlite3") as {
    new (databasePath: string): BetterSqlite3Database;
  };
  const database = new BetterSqlite3(databasePath);
  initializeSqliteDatabase(database);

  return {
    async getUserByEmail(email) {
      return (
        database
          .prepare(
            `
              SELECT ${USER_SELECT}
              FROM users
              WHERE email = ?
            `
          )
          .get<DatabaseUserRow>(email.trim().toLowerCase()) ?? null
      );
    },
    async getUserByIdentifier(identifier) {
      const normalizedIdentifier = identifier.trim().toLowerCase();

      return (
        database
          .prepare(
            `
              SELECT ${USER_SELECT}
              FROM users
              WHERE LOWER(email) = ? OR LOWER(COALESCE(name, '')) = ?
              ORDER BY CASE WHEN LOWER(email) = ? THEN 0 ELSE 1 END
              LIMIT 1
            `
          )
          .get<DatabaseUserRow>(
            normalizedIdentifier,
            normalizedIdentifier,
            normalizedIdentifier
          ) ?? null
      );
    },
    async getUserById(userId) {
      return (
        database
          .prepare(
            `
              SELECT ${USER_SELECT}
              FROM users
              WHERE id = ?
            `
          )
          .get<DatabaseUserRow>(userId) ?? null
      );
    },
    async listUsers() {
      return database
        .prepare(
          `
            SELECT ${USER_SELECT}
            FROM users
            ORDER BY created_at DESC
          `
        )
        .all<DatabaseUserRow>();
    },
    async countUsers() {
      return (
        database
          .prepare("SELECT COUNT(*) as count FROM users")
          .get<{ count: number }>()?.count ?? 0
      );
    },
    async countUsersByRole(role) {
      return (
        database
          .prepare("SELECT COUNT(*) as count FROM users WHERE role = ?")
          .get<{ count: number }>(role)?.count ?? 0
      );
    },
    async createUser(input) {
      try {
        const result = database
          .prepare(
            `
              INSERT INTO users (
                name,
                email,
                password_hash,
                role,
                image,
                is_active,
                created_at,
                updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `
          )
          .run(
            input.name,
            input.email,
            input.passwordHash,
            input.role,
            input.image ?? null,
            input.isActive ? 1 : 0,
            input.createdAt,
            input.updatedAt
          );

        const created =
          database
            .prepare(
              `
                SELECT ${USER_SELECT}
                FROM users
                WHERE id = ?
              `
            )
            .get<DatabaseUserRow>(Number(result.lastInsertRowid)) ?? null;

        if (!created) {
          throw new Error("Unable to create user.");
        }

        return created;
      } catch (error) {
        if (
          error instanceof Error &&
          `${error.message}`.toLowerCase().includes("unique") &&
          `${error.message}`.toLowerCase().includes("email")
        ) {
          throw new Error("An account with that email already exists.");
        }

        throw error;
      }
    },
    async updateUser(userId, input) {
      const { assignments, values } = buildSqliteUserPatch(input);

      database
        .prepare(`UPDATE users SET ${assignments.join(", ")} WHERE id = ?`)
        .run(...values, userId);

      return (
        database
          .prepare(
            `
              SELECT ${USER_SELECT}
              FROM users
              WHERE id = ?
            `
          )
          .get<DatabaseUserRow>(userId) ?? null
      );
    },
    async deleteUser(userId) {
      database.prepare("DELETE FROM users WHERE id = ?").run(userId);
    },
    async deleteSessionsForUser(userId) {
      database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    },
    async createSession(input) {
      database
        .prepare(
          `
            INSERT INTO sessions (user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?)
          `
        )
        .run(input.userId, input.tokenHash, input.expiresAt, input.createdAt);
    },
    async deleteSessionByTokenHash(tokenHash) {
      database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    },
    async getSessionUserByTokenHash(tokenHash) {
      return (
        database
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
          .get<DatabaseSessionUserRow>(tokenHash) ?? null
      );
    },
    async deleteUsedOrExpiredPasswordResetTokens(nowIso) {
      database
        .prepare(
          "DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL OR expires_at <= ?"
        )
        .run(nowIso);
    },
    async createPasswordResetToken(input) {
      database
        .prepare(
          `
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?)
          `
        )
        .run(input.userId, input.tokenHash, input.expiresAt, input.createdAt);
    },
    async getPasswordResetTokenByHash(tokenHash) {
      return (
        database
          .prepare(
            `
              SELECT ${PASSWORD_RESET_TOKEN_SELECT}
              FROM password_reset_tokens
              WHERE token_hash = ?
            `
          )
          .get<DatabasePasswordResetTokenRow>(tokenHash) ?? null
      );
    },
    async markPasswordResetTokenUsed(id, usedAt) {
      database
        .prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?")
        .run(usedAt, id);
    },
    async getBackdropOverride(movieId) {
      return (
        database
          .prepare(
            `
              SELECT ${BACKDROP_OVERRIDE_SELECT}
              FROM movie_backdrop_overrides
              WHERE movie_id = ?
            `
          )
          .get<DatabaseBackdropOverrideRow>(movieId) ?? null
      );
    },
    async upsertBackdropOverride(input) {
      database
        .prepare(
          `
            INSERT INTO movie_backdrop_overrides (
              movie_id,
              selected_backdrop_path,
              source,
              selected_by_user_id,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(movie_id) DO UPDATE SET
              selected_backdrop_path = excluded.selected_backdrop_path,
              source = excluded.source,
              selected_by_user_id = excluded.selected_by_user_id,
              updated_at = excluded.updated_at
          `
        )
        .run(
          input.movieId,
          input.selectedBackdropPath,
          input.source,
          input.selectedByUserId,
          input.createdAt,
          input.updatedAt
        );

      return (
        database
          .prepare(
            `
              SELECT ${BACKDROP_OVERRIDE_SELECT}
              FROM movie_backdrop_overrides
              WHERE movie_id = ?
            `
          )
          .get<DatabaseBackdropOverrideRow>(input.movieId) ?? null
      );
    },
    async deleteBackdropOverride(movieId) {
      database
        .prepare("DELETE FROM movie_backdrop_overrides WHERE movie_id = ?")
        .run(movieId);
    },
  };
}

function createSupabaseStorageProvider(databaseUrl: string): StorageProvider {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required when DATABASE_URL is set to a Supabase project URL."
    );
  }

  const baseUrl = normalizeSupabaseProjectUrl(databaseUrl);
  const apiKey = env.SUPABASE_SERVICE_ROLE_KEY;

  async function request<T>(
    tableName: string,
    options?: {
      method?: "GET" | "POST" | "PATCH" | "DELETE";
      query?: Record<string, string | number | undefined>;
      body?: unknown;
      prefer?: string[];
    }
  ) {
    const url = new URL(`/rest/v1/${tableName}`, `${baseUrl}/`);

    for (const [key, value] of Object.entries(options?.query ?? {})) {
      if (value === undefined) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, {
      method: options?.method ?? "GET",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(options?.prefer?.length
          ? {
              Prefer: options.prefer.join(","),
            }
          : {}),
      },
      body: options?.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });

    const text = await response.text();
    const payload = text
      ? (() => {
          try {
            return JSON.parse(text) as unknown;
          } catch {
            return text;
          }
        })()
      : null;

    if (!response.ok) {
      const errorPayload =
        payload && typeof payload === "object"
          ? (payload as SupabaseErrorPayload)
          : undefined;
      const isMissingRelation = errorPayload?.code === "PGRST205";

      throw new SupabaseRequestError(
        isMissingRelation
          ? "Supabase storage tables are missing. Run supabase/schema.sql in the Supabase SQL editor, then redeploy."
          : errorPayload?.message ||
              `Supabase request to ${tableName} failed with status ${response.status}.`,
        response.status,
        errorPayload?.code,
        errorPayload?.details,
        errorPayload?.hint
      );
    }

    return payload as T;
  }

  async function selectRows<T>(
    tableName: string,
    query: Record<string, string | number | undefined>
  ) {
    return (await request<T[]>(tableName, { query })) ?? [];
  }

  async function selectSingleRow<T>(
    tableName: string,
    query: Record<string, string | number | undefined>
  ) {
    const rows = await selectRows<T>(tableName, {
      ...query,
      limit: 1,
    });

    return rows[0] ?? null;
  }

  return {
    async getUserByEmail(email) {
      return selectSingleRow<DatabaseUserRow>("users", {
        select: USER_SELECT,
        email: `eq.${email.trim().toLowerCase()}`,
      });
    },
    async getUserByIdentifier(identifier) {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const emailMatch = await selectSingleRow<DatabaseUserRow>("users", {
        select: USER_SELECT,
        email: `eq.${normalizedIdentifier}`,
      });

      if (emailMatch) {
        return emailMatch;
      }

      const nameMatches = await selectRows<DatabaseUserRow>("users", {
        select: USER_SELECT,
        name: `ilike.${normalizedIdentifier}`,
      });

      return (
        nameMatches.find(
          (row) => (row.name?.trim().toLowerCase() ?? "") === normalizedIdentifier
        ) ?? null
      );
    },
    async getUserById(userId) {
      return selectSingleRow<DatabaseUserRow>("users", {
        select: USER_SELECT,
        id: `eq.${userId}`,
      });
    },
    async listUsers() {
      return selectRows<DatabaseUserRow>("users", {
        select: USER_SELECT,
        order: "created_at.desc",
      });
    },
    async countUsers() {
      const rows = await selectRows<{ id: number }>("users", {
        select: "id",
      });

      return rows.length;
    },
    async countUsersByRole(role) {
      const rows = await selectRows<{ id: number }>("users", {
        select: "id",
        role: `eq.${role}`,
      });

      return rows.length;
    },
    async createUser(input) {
      try {
        const rows = await request<DatabaseUserRow[]>("users", {
          method: "POST",
          query: {
            select: USER_SELECT,
          },
          body: {
            name: input.name,
            email: input.email,
            password_hash: input.passwordHash,
            role: input.role,
            image: input.image ?? null,
            is_active: input.isActive ? 1 : 0,
            created_at: input.createdAt,
            updated_at: input.updatedAt,
          },
          prefer: ["return=representation"],
        });

        const created = rows?.[0];

        if (!created) {
          throw new Error("Unable to create user.");
        }

        return created;
      } catch (error) {
        if (isSupabaseUniqueEmailError(error)) {
          throw new Error("An account with that email already exists.");
        }

        throw error;
      }
    },
    async updateUser(userId, input) {
      const rows = await request<DatabaseUserRow[]>("users", {
        method: "PATCH",
        query: {
          id: `eq.${userId}`,
          select: USER_SELECT,
        },
        body: buildSupabaseUserPatch(input),
        prefer: ["return=representation"],
      });

      return rows?.[0] ?? null;
    },
    async deleteUser(userId) {
      await request("users", {
        method: "DELETE",
        query: {
          id: `eq.${userId}`,
        },
      });
    },
    async deleteSessionsForUser(userId) {
      await request("sessions", {
        method: "DELETE",
        query: {
          user_id: `eq.${userId}`,
        },
      });
    },
    async createSession(input) {
      await request("sessions", {
        method: "POST",
        body: {
          user_id: input.userId,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt,
          created_at: input.createdAt,
        },
      });
    },
    async deleteSessionByTokenHash(tokenHash) {
      await request("sessions", {
        method: "DELETE",
        query: {
          token_hash: `eq.${tokenHash}`,
        },
      });
    },
    async getSessionUserByTokenHash(tokenHash) {
      const session = await selectSingleRow<{
        user_id: number;
        expires_at: string;
      }>("sessions", {
        select: "user_id,expires_at",
        token_hash: `eq.${tokenHash}`,
      });

      if (!session) {
        return null;
      }

      const user = await selectSingleRow<DatabaseUserRow>("users", {
        select: USER_SELECT,
        id: `eq.${session.user_id}`,
      });

      if (!user) {
        return null;
      }

      return {
        ...user,
        expires_at: session.expires_at,
      };
    },
    async deleteUsedOrExpiredPasswordResetTokens(nowIso) {
      const tokens = await selectRows<DatabasePasswordResetTokenRow>("password_reset_tokens", {
        select: PASSWORD_RESET_TOKEN_SELECT,
      });

      const staleTokenIds = tokens
        .filter((token) => token.used_at !== null || token.expires_at <= nowIso)
        .map((token) => token.id);

      await Promise.all(
        staleTokenIds.map((id) =>
          request("password_reset_tokens", {
            method: "DELETE",
            query: {
              id: `eq.${id}`,
            },
          })
        )
      );
    },
    async createPasswordResetToken(input) {
      await request("password_reset_tokens", {
        method: "POST",
        body: {
          user_id: input.userId,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt,
          created_at: input.createdAt,
        },
      });
    },
    async getPasswordResetTokenByHash(tokenHash) {
      return selectSingleRow<DatabasePasswordResetTokenRow>("password_reset_tokens", {
        select: PASSWORD_RESET_TOKEN_SELECT,
        token_hash: `eq.${tokenHash}`,
      });
    },
    async markPasswordResetTokenUsed(id, usedAt) {
      await request("password_reset_tokens", {
        method: "PATCH",
        query: {
          id: `eq.${id}`,
        },
        body: {
          used_at: usedAt,
        },
      });
    },
    async getBackdropOverride(movieId) {
      return selectSingleRow<DatabaseBackdropOverrideRow>("movie_backdrop_overrides", {
        select: BACKDROP_OVERRIDE_SELECT,
        movie_id: `eq.${movieId}`,
      });
    },
    async upsertBackdropOverride(input) {
      const rows = await request<DatabaseBackdropOverrideRow[]>("movie_backdrop_overrides", {
        method: "POST",
        query: {
          on_conflict: "movie_id",
          select: BACKDROP_OVERRIDE_SELECT,
        },
        body: {
          movie_id: input.movieId,
          selected_backdrop_path: input.selectedBackdropPath,
          source: input.source,
          selected_by_user_id: input.selectedByUserId,
          created_at: input.createdAt,
          updated_at: input.updatedAt,
        },
        prefer: ["resolution=merge-duplicates", "return=representation"],
      });

      return rows?.[0] ?? null;
    },
    async deleteBackdropOverride(movieId) {
      await request("movie_backdrop_overrides", {
        method: "DELETE",
        query: {
          movie_id: `eq.${movieId}`,
        },
      });
    },
  };
}

function createStorageProvider() {
  if (!env.DATABASE_URL) {
    return null;
  }

  if (env.DATABASE_URL.startsWith("file:")) {
    return createSqliteStorageProvider(env.DATABASE_URL);
  }

  if (hasSupabaseProjectUrl(env.DATABASE_URL)) {
    return createSupabaseStorageProvider(env.DATABASE_URL);
  }

  throw new Error(
    `Unsupported DATABASE_URL "${env.DATABASE_URL}". Use a file: URL for SQLite or your Supabase project URL, for example https://your-project-ref.supabase.co.`
  );
}

function getStorageProvider() {
  if (storageProvider === undefined) {
    storageProvider = createStorageProvider();
  }

  return storageProvider;
}

function requireStorageProvider() {
  const provider = getStorageProvider();

  if (!provider) {
    throw new Error(
      "Database storage is not configured. Set DATABASE_URL to a SQLite file: URL or Supabase project URL. Supabase deployments can also use NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL, and they must also set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return provider;
}

export function hasDatabaseConfiguration() {
  return Boolean(env.DATABASE_URL);
}

export async function getUserRecordByEmail(email: string) {
  return requireStorageProvider().getUserByEmail(email);
}

export async function getUserRecordByIdentifier(identifier: string) {
  return requireStorageProvider().getUserByIdentifier(identifier);
}

export async function getUserRecordById(userId: number) {
  return requireStorageProvider().getUserById(userId);
}

export async function listUserRecords() {
  return requireStorageProvider().listUsers();
}

export async function countUserRecords() {
  return requireStorageProvider().countUsers();
}

export async function countUserRecordsByRole(role: StoredUserRole) {
  return requireStorageProvider().countUsersByRole(role);
}

export async function createUserRecord(input: CreateUserRecordInput) {
  return requireStorageProvider().createUser(input);
}

export async function updateUserRecord(userId: number, input: UpdateUserRecordInput) {
  return requireStorageProvider().updateUser(userId, input);
}

export async function deleteUserRecord(userId: number) {
  return requireStorageProvider().deleteUser(userId);
}

export async function deleteSessionRecordsForUser(userId: number) {
  return requireStorageProvider().deleteSessionsForUser(userId);
}

export async function createSessionRecord(input: CreateSessionRecordInput) {
  return requireStorageProvider().createSession(input);
}

export async function deleteSessionRecordByTokenHash(tokenHash: string) {
  return requireStorageProvider().deleteSessionByTokenHash(tokenHash);
}

export async function getSessionUserRecordByTokenHash(tokenHash: string) {
  return requireStorageProvider().getSessionUserByTokenHash(tokenHash);
}

export async function prunePasswordResetTokenRecords(nowIso: string) {
  return requireStorageProvider().deleteUsedOrExpiredPasswordResetTokens(nowIso);
}

export async function createPasswordResetTokenRecord(
  input: CreatePasswordResetTokenRecordInput
) {
  return requireStorageProvider().createPasswordResetToken(input);
}

export async function getPasswordResetTokenRecordByHash(tokenHash: string) {
  return requireStorageProvider().getPasswordResetTokenByHash(tokenHash);
}

export async function markPasswordResetTokenRecordUsed(id: number, usedAt: string) {
  return requireStorageProvider().markPasswordResetTokenUsed(id, usedAt);
}

export async function getMovieBackdropOverrideRecord(movieId: number) {
  return requireStorageProvider().getBackdropOverride(movieId);
}

export async function upsertMovieBackdropOverrideRecord(
  input: UpsertBackdropOverrideRecordInput
) {
  return requireStorageProvider().upsertBackdropOverride(input);
}

export async function deleteMovieBackdropOverrideRecord(movieId: number) {
  return requireStorageProvider().deleteBackdropOverride(movieId);
}
