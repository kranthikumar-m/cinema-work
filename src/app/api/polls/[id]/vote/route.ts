import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { consumeRateLimit, getRequestClientId } from "@/lib/auth-rate-limit";
import { getPollRecord, hasDatabaseConfiguration, upsertPollVoteRecord } from "@/lib/database";
import { resolveVoterIdentity, VOTER_COOKIE, voterCookieOptions } from "@/lib/voter-key";
import { getPollViews } from "@/services/community";

interface RouteContext {
  params: { id: string };
}

/**
 * Casts (or changes) the caller's vote on a poll. Guests are identified by a
 * long-lived cookie so each browser votes once; signed-in users by account.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const pollId = Number(params.id);
  if (!Number.isInteger(pollId) || pollId <= 0) {
    return NextResponse.json({ error: "Invalid poll id." }, { status: 400 });
  }
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const limit = consumeRateLimit("poll-vote", getRequestClientId(request), {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many votes. Please slow down." }, { status: 429 });
  }

  let body: { optionIndex?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const poll = await getPollRecord(pollId);
  if (!poll || poll.is_active !== 1) {
    return NextResponse.json({ error: "This poll is closed." }, { status: 404 });
  }
  let optionCount = 0;
  try {
    optionCount = (JSON.parse(poll.options) as unknown[]).length;
  } catch {
    optionCount = 0;
  }
  const optionIndex = Number(body.optionIndex);
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= optionCount) {
    return NextResponse.json({ error: "Pick one of the poll's options." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const voter = resolveVoterIdentity(user);
  await upsertPollVoteRecord(pollId, voter.key, optionIndex, new Date().toISOString());

  const [view] = await getPollViews(voter.key, { activeOnly: false, limit: 100 }).then((polls) =>
    polls.filter((entry) => entry.id === pollId)
  );
  const response = NextResponse.json({ ok: true, poll: view ?? null });
  if (voter.fresh) response.cookies.set(VOTER_COOKIE, voter.fresh, voterCookieOptions);
  return response;
}
