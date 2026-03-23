import fs from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";

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

let databaseInstance: BetterSqlite3Database | null | undefined;

function resolveDatabasePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      `Unsupported DATABASE_URL "${databaseUrl}". This implementation currently supports file: URLs only.`
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

function initializeDatabase(database: BetterSqlite3Database) {
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
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

    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);
}

function createDatabaseInstance() {
  if (!env.DATABASE_URL) {
    return null;
  }

  const databasePath = resolveDatabasePath(env.DATABASE_URL);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const BetterSqlite3 = require("better-sqlite3") as {
    new (databasePath: string): BetterSqlite3Database;
  };
  const database = new BetterSqlite3(databasePath);
  initializeDatabase(database);
  return database;
}

export function getOptionalDatabase() {
  if (databaseInstance === undefined) {
    databaseInstance = createDatabaseInstance();
  }

  return databaseInstance;
}

export function requireDatabase() {
  const database = getOptionalDatabase();

  if (!database) {
    throw new Error(
      "DATABASE_URL is required for admin authentication and backdrop override storage."
    );
  }

  return database;
}
