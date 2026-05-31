import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminApiUser } from "@/lib/admin-api";
import { clearValidatedYearFreeze } from "@/lib/database";
import { getIndianCurrentYear } from "@/lib/date";
import { VALIDATED_CATALOG_CACHE_TAG } from "@/services/telugu-movies";

export const dynamic = "force-dynamic";

// How many past years to clear when no specific year is given.
const CLEAR_LOOKBACK_YEARS = 12;

/**
 * Drops a frozen validated year (or the recent past-year window) so it is
 * re-validated against Wikipedia on the next catalog build. Use after tuning
 * the matching thresholds.
 */
export async function DELETE(request: Request) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const yearParam = url.searchParams.get("year");

  try {
    if (yearParam) {
      const year = Number(yearParam);
      if (!Number.isInteger(year) || year < 1900 || year > 3000) {
        return NextResponse.json({ error: "Invalid year." }, { status: 400 });
      }
      await clearValidatedYearFreeze(year);
      revalidateTag(VALIDATED_CATALOG_CACHE_TAG);
      return NextResponse.json({ ok: true, cleared: [year] });
    }

    const currentYear = getIndianCurrentYear();
    const cleared: number[] = [];
    for (let year = currentYear - 1; year >= currentYear - CLEAR_LOOKBACK_YEARS; year -= 1) {
      await clearValidatedYearFreeze(year);
      cleared.push(year);
    }

    revalidateTag(VALIDATED_CATALOG_CACHE_TAG);
    return NextResponse.json({ ok: true, cleared });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to clear validated years.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
