import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { hasDatabaseConfiguration, insertQuizQuestionRecord } from "@/lib/database";
import { getQuizViews } from "@/services/community";

/** All quiz questions with answer stats and the correct option revealed. */
export async function GET() {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  const questions = await getQuizViews(null, { activeOnly: false, limit: 200, reveal: true });
  return NextResponse.json({ questions }, { headers: { "Cache-Control": "no-store" } });
}

/** Creates a question. Body: { question, options: string[], correctIndex, category? }. */
export async function POST(request: Request) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  let body: { question?: unknown; options?: unknown; correctIndex?: unknown; category?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const options = Array.isArray(body.options)
    ? body.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 6)
    : [];
  const correctIndex = Number(body.correctIndex);
  const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "General";

  if (question.length < 5 || question.length > 300) {
    return NextResponse.json({ error: "Question must be 5 to 300 characters." }, { status: 400 });
  }
  if (options.length < 2) {
    return NextResponse.json({ error: "Give the question at least two options." }, { status: 400 });
  }
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    return NextResponse.json({ error: "correctIndex must point at one of the options." }, { status: 400 });
  }

  const created = await insertQuizQuestionRecord({
    question,
    options,
    correctIndex,
    category,
    isActive: true,
    createdByUserId: auth.user.id,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, question: created });
}
