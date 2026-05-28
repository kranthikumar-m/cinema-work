import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runSongSync } from "@/services/song-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  if (!env.CRON_SECRET) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${env.CRON_SECRET}`) return true;

  const { searchParams } = new URL(request.url);
  return searchParams.get("secret") === env.CRON_SECRET;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSongSync();
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Song sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
