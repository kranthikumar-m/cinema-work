import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { deletePollRecord, hasDatabaseConfiguration, setPollActiveRecord } from "@/lib/database";

interface RouteContext {
  params: { id: string };
}

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Open or close a poll. Body: { isActive: boolean }. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid poll id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  let body: { isActive?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean." }, { status: 400 });
  }
  await setPollActiveRecord(id, body.isActive);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin"]);
  if (auth.response) return auth.response;
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid poll id." }, { status: 400 });
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  await deletePollRecord(id);
  return NextResponse.json({ ok: true });
}
