import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { hasDatabaseConfiguration, insertPollRecord } from "@/lib/database";
import { getPollViews } from "@/services/community";

/** All polls (active and closed) with vote counts. */
export async function GET() {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  const polls = await getPollViews(null, { activeOnly: false, limit: 200 });
  return NextResponse.json({ polls }, { headers: { "Cache-Control": "no-store" } });
}

/** Creates a poll. Body: { question, options: string[], movieId?, movieTitle? }. */
export async function POST(request: Request) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  let body: { question?: unknown; options?: unknown; movieId?: unknown; movieTitle?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const options = Array.isArray(body.options)
    ? body.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 8)
    : [];
  if (question.length < 5 || question.length > 300) {
    return NextResponse.json({ error: "Question must be 5 to 300 characters." }, { status: 400 });
  }
  if (options.length < 2) {
    return NextResponse.json({ error: "Give the poll at least two options." }, { status: 400 });
  }
  const movieId = Number(body.movieId);
  const movieTitle = typeof body.movieTitle === "string" ? body.movieTitle.trim() : "";

  const poll = await insertPollRecord({
    question,
    options,
    movieId: Number.isInteger(movieId) && movieId > 0 ? movieId : null,
    movieTitle: movieTitle || null,
    isActive: true,
    createdByUserId: auth.user.id,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, poll });
}
