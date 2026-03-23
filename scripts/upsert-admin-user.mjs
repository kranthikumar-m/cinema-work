import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import Database from 'better-sqlite3';

const PASSWORD_KEY_BYTES = 64;
const requestedUsername = 'admin123';
const requestedPassword = 'password123';
const requestedRole = 'admin';
const databaseUrl = process.env.DATABASE_URL || 'file:./data/cinema.sqlite';

function resolveDatabasePath(url) {
  if (!url.startsWith('file:')) {
    throw new Error(`Unsupported DATABASE_URL: ${url}`);
  }

  const rawPath = url.slice('file:'.length);
  if (!rawPath) {
    throw new Error('DATABASE_URL must include a file path after file:');
  }

  return path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
}

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, PASSWORD_KEY_BYTES).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [algorithm, salt, expectedHash] = String(storedHash || '').split(':');
  if (algorithm !== 'scrypt' || !salt || !expectedHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, expectedHash.length / 2);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  return derivedHash.length === expectedBuffer.length && timingSafeEqual(derivedHash, expectedBuffer);
}

const databasePath = resolveDatabasePath(databaseUrl);
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new Database(databasePath);

db.pragma('journal_mode = WAL');
db.exec(`
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

  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

const existing = db
  .prepare(
    `SELECT id, name, email, password_hash, role, is_active, created_at, updated_at
     FROM users
     WHERE LOWER(email) = LOWER(?) OR LOWER(COALESCE(name, '')) = LOWER(?)
     ORDER BY CASE WHEN LOWER(email) = LOWER(?) THEN 0 ELSE 1 END, id ASC
     LIMIT 1`
  )
  .get(requestedUsername, requestedUsername, requestedUsername);

const timestamp = nowIso();
const nextPasswordHash = hashPassword(requestedPassword);
let changedAction = 'created';
let userId;

if (existing) {
  db.prepare(
    `UPDATE users
     SET name = ?,
         email = ?,
         password_hash = ?,
         role = ?,
         is_active = 1,
         updated_at = ?
     WHERE id = ?`
  ).run(requestedUsername, requestedUsername, nextPasswordHash, requestedRole, timestamp, existing.id);
  changedAction = 'updated';
  userId = existing.id;
} else {
  const result = db.prepare(
    `INSERT INTO users (
       name,
       email,
       password_hash,
       role,
       is_active,
       created_at,
       updated_at
     ) VALUES (?, ?, ?, ?, 1, ?, ?)`
  ).run(requestedUsername, requestedUsername, nextPasswordHash, requestedRole, timestamp, timestamp);
  userId = Number(result.lastInsertRowid);
}

const stored = db.prepare(
  `SELECT id, name, email, password_hash, role, is_active, created_at, updated_at
   FROM users
   WHERE id = ?`
).get(userId);

if (!stored) {
  throw new Error('Failed to load the upserted admin user.');
}

if (stored.role !== requestedRole || stored.email !== requestedUsername || stored.name !== requestedUsername) {
  throw new Error('Stored user record does not match the requested admin credentials.');
}

if (!stored.is_active) {
  throw new Error('Stored user is not active.');
}

if (!verifyPassword(requestedPassword, stored.password_hash)) {
  throw new Error('Stored password hash does not validate against the requested password.');
}

console.log(JSON.stringify({
  action: changedAction,
  databasePath,
  table: 'users',
  user: {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    role: stored.role,
    is_active: stored.is_active,
    created_at: stored.created_at,
    updated_at: stored.updated_at,
  },
}, null, 2));
