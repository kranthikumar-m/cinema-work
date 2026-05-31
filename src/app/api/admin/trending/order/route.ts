import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  setAdminTrendingOrderRecords,
  clearAdminTrendingOrderRecords,
} from "@/lib/database";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  let body: { order?: unknown };
  try {
    body = (await request.json()) as { order?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const order = Array.isArray(body.order)
    ? body.order.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : null;

  if (!order || order.length !== (body.order as unknown[]).length) {
    return NextResponse.json(
      { error: "`order` must be an array of movie ids." },
      { status: 400 }
    );
  }

  try {
    await setAdminTrendingOrderRecords(order, new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save trending order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  try {
    await clearAdminTrendingOrderRecords(new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset trending order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
