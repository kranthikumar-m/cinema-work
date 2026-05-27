import { NextResponse } from "next/server";
import { deleteUserByAdmin, updateUserByAdmin } from "@/lib/auth";
import { requireAdminApiUser } from "@/lib/admin-api";
import type { ManageableUserRole } from "@/types/admin";

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
    const body = (await request.json()) as {
      name?: string;
      role?: ManageableUserRole;
      isActive?: boolean;
      image?: string | null;
    };
    const user = await updateUserByAdmin(userId, {
      name: body.name,
      role: body.role,
      isActive: body.isActive,
      image: body.image,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update user.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin"]);

  if (auth.response) {
    return auth.response;
  }

  const userId = Number(params.id);

  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    await deleteUserByAdmin(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete user.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
