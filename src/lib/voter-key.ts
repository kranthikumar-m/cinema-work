import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { AuthUser } from "@/types/auth";

/**
 * Identity for one poll vote / quiz answer. Signed-in users vote as
 * `user:<id>`; guests get a random id in a long-lived cookie so they can vote
 * once and see their choice again. The API route sets the cookie when `fresh`
 * is returned.
 */
export const VOTER_COOKIE = "tcu_voter";

export interface VoterIdentity {
  key: string;
  /** New anonymous id that still needs to be written to the cookie. */
  fresh: string | null;
}

export function resolveVoterIdentity(user: AuthUser | null): VoterIdentity {
  if (user) return { key: `user:${user.id}`, fresh: null };
  const existing = cookies().get(VOTER_COOKIE)?.value;
  if (existing && /^[a-z0-9-]{8,64}$/i.test(existing)) {
    return { key: `anon:${existing}`, fresh: null };
  }
  const id = randomUUID();
  return { key: `anon:${id}`, fresh: id };
}

/** Voter key for read-only rendering: never mints a new id. */
export function peekVoterKey(user: AuthUser | null): string | null {
  if (user) return `user:${user.id}`;
  const existing = cookies().get(VOTER_COOKIE)?.value;
  return existing && /^[a-z0-9-]{8,64}$/i.test(existing) ? `anon:${existing}` : null;
}

export const voterCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};
