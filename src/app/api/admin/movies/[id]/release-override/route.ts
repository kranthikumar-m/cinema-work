import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  getMovieReleaseOverrideRecord,
  upsertMovieReleaseOverrideRecord,
  deleteMovieReleaseOverrideRecord,
} from "@/lib/database";

interface RouteContext {
  params: { id: string };
}

function parseAliases(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((a) => typeof a === "string") : [];
  } catch {
    return [];
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Calibrates a movie's release date from AndhraBoxOffice (admin drag-and-drop).
 * Sets the override date and, when the ABO title differs, adds it as an alias
 * tag (merged with any existing aliases).
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
    const { releaseDate, alias } = body as { releaseDate?: string | null; alias?: string };

    if (releaseDate && !ISO_DATE.test(releaseDate)) {
      return NextResponse.json(
        { error: "releaseDate must be YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const existing = await getMovieReleaseOverrideRecord(movieId);
    const aliases = parseAliases(existing?.aliases ?? null);
    const cleanAlias = alias?.trim();
    if (
      cleanAlias &&
      !aliases.some((a) => a.toLowerCase() === cleanAlias.toLowerCase())
    ) {
      aliases.push(cleanAlias);
    }

    await upsertMovieReleaseOverrideRecord({
      movieId,
      releaseDate: releaseDate ?? existing?.release_date ?? null,
      aliases,
      addedByUserId: auth.user.id,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, releaseDate: releaseDate ?? existing?.release_date ?? null, aliases });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to set release override.";
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
    await deleteMovieReleaseOverrideRecord(movieId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to clear release override.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
