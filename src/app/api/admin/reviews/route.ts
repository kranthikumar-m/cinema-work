import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { hasDatabaseConfiguration, listAllUserReviewRecords } from "@/lib/database";
import { toReviewView } from "@/services/community";

/** Newest user reviews across all films, including hidden ones, for moderation. */
export async function GET() {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  if (!hasDatabaseConfiguration()) return NextResponse.json({ reviews: [] });

  const rows = await listAllUserReviewRecords(200);
  return NextResponse.json(
    { reviews: rows.map((row) => toReviewView(row, null)) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
