import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { getAndhraBoxOfficeUpcoming } from "@/services/andhra-box-office";
import { getIndianTodayIsoDate } from "@/lib/date";

/**
 * AndhraBoxOffice's upcoming Telugu release calendar, for the admin date-
 * calibration sidebar. Returns unreleased, deduped entries sorted by date.
 */
export async function GET() {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  try {
    const today = getIndianTodayIsoDate();
    const entries = await getAndhraBoxOfficeUpcoming();

    const seen = new Set<string>();
    const upcoming = entries
      .filter((entry) => {
        if (entry.releaseDate && entry.releaseDate <= today) return false;
        if (seen.has(entry.normalizedTitle)) return false;
        seen.add(entry.normalizedTitle);
        return true;
      })
      .sort((a, b) =>
        (a.releaseDate || "9999-12-31").localeCompare(b.releaseDate || "9999-12-31")
      )
      .map((entry) => ({ title: entry.title, releaseDate: entry.releaseDate }));

    return NextResponse.json({ results: upcoming });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load ABO info.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
