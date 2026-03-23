import { NextResponse } from "next/server";
import { updateAdminUserRole } from "@/lib/auth";
import { requireAdminApiUser } from "@/lib/admin-api";
import type { AdminRole } from "@/types/admin";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin"]);

  if (auth.response) {
    return auth.response;
  }

  const userId = Number(params.id);

  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { role?: AdminRole };
    const users = await updateAdminUserRole(userId, body.role ?? "viewer");
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update user.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
