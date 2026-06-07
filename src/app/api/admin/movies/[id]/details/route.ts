import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  upsertMovieDetailOverrideRecord,
  deleteMovieDetailOverrideRecord,
} from "@/lib/database";
import type {
  DetailFact,
  MovieCompanyCredits,
} from "@/types/admin";

interface RouteContext {
  params: { id: string };
}

function cleanFacts(input: unknown): DetailFact[] | null {
  if (!Array.isArray(input)) return null;
  const facts: DetailFact[] = [];
  for (const row of input) {
    const label = typeof row?.label === "string" ? row.label.trim() : "";
    const values = Array.isArray(row?.values)
      ? row.values.map((v: unknown) => String(v).trim()).filter(Boolean)
      : [];
    if (label && values.length) facts.push({ label, values });
  }
  return facts;
}

function cleanCompanyList(input: unknown): { name: string; detail: string | null }[] {
  if (!Array.isArray(input)) return [];
  const out: { name: string; detail: string | null }[] = [];
  for (const c of input) {
    const name = typeof c?.name === "string" ? c.name.trim() : "";
    if (!name) continue;
    const detail = typeof c?.detail === "string" && c.detail.trim() ? c.detail.trim() : null;
    out.push({ name, detail });
  }
  return out;
}

function cleanCompanies(input: unknown): MovieCompanyCredits | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  return {
    production: cleanCompanyList(obj.production),
    distributors: cleanCompanyList(obj.distributors),
    other: cleanCompanyList(obj.other),
  };
}

/**
 * Saves admin overrides for a movie's Movie Facts + Company Credits. Each is a
 * full snapshot (null = no override → fall back to the auto-sourced data).
 */
export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const facts = "facts" in body ? cleanFacts(body.facts) : null;
    const companies = "companies" in body ? cleanCompanies(body.companies) : null;

    await upsertMovieDetailOverrideRecord({
      movieId,
      facts: facts ? JSON.stringify(facts) : null,
      companies: companies ? JSON.stringify(companies) : null,
      addedByUserId: auth.user.id,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    await deleteMovieDetailOverrideRecord(movieId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
