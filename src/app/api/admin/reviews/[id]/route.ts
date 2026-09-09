import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  deleteUserReviewRecord,
  hasDatabaseConfiguration,
  setUserReviewStatusRecord,
} from "@/lib/database";

interface RouteContext {
  params: { id: string };
}

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Hide or re-publish a user review. Body: { status: "published" | "hidden" }. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid review id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  let body: { status?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (body.status !== "published" && body.status !== "hidden") {
    return NextResponse.json({ error: "status must be published or hidden." }, { status: 400 });
  }

  await setUserReviewStatusRecord(id, body.status, new Date().toISOString());
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin"]);
  if (auth.response) return auth.response;
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid review id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  await deleteUserReviewRecord(id);
  return NextResponse.json({ ok: true });
}
