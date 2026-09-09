import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { consumeRateLimit, getRequestClientId } from "@/lib/auth-rate-limit";
import {
  getQuizQuestionRecord,
  hasDatabaseConfiguration,
  insertQuizAnswerRecord,
} from "@/lib/database";
import { resolveVoterIdentity, VOTER_COOKIE, voterCookieOptions } from "@/lib/voter-key";
import { getQuizViews } from "@/services/community";

interface RouteContext {
  params: { id: string };
}

/** Records the caller's answer to a quiz question (first answer only) and reveals the result. */
export async function POST(request: Request, { params }: RouteContext) {
  const questionId = Number(params.id);
  if (!Number.isInteger(questionId) || questionId <= 0) {
    return NextResponse.json({ error: "Invalid question id." }, { status: 400 });
  }
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const limit = consumeRateLimit("quiz-answer", getRequestClientId(request), {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many answers. Please slow down." }, { status: 429 });
  }

  let body: { optionIndex?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = await getQuizQuestionRecord(questionId);
  if (!question || question.is_active !== 1) {
    return NextResponse.json({ error: "This question is no longer open." }, { status: 404 });
  }
  let optionCount = 0;
  try {
    optionCount = (JSON.parse(question.options) as unknown[]).length;
  } catch {
    optionCount = 0;
  }
  const optionIndex = Number(body.optionIndex);
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= optionCount) {
    return NextResponse.json({ error: "Pick one of the answers." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const voter = resolveVoterIdentity(user);
  await insertQuizAnswerRecord(
    questionId,
    voter.key,
    optionIndex,
    optionIndex === question.correct_index,
    new Date().toISOString()
  );

  const [view] = await getQuizViews(voter.key, { activeOnly: false, limit: 100 }).then((list) =>
    list.filter((entry) => entry.id === questionId)
  );
  const response = NextResponse.json({ ok: true, question: view ?? null });
  if (voter.fresh) response.cookies.set(VOTER_COOKIE, voter.fresh, voterCookieOptions);
  return response;
}
