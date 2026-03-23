import { NextResponse } from "next/server";
import { createAdminUser, listAdminUsers } from "@/lib/auth";
import { requireAdminApiUser } from "@/lib/admin-api";
import type { AdminRole } from "@/types/admin";

export async function GET() {
  const auth = await requireAdminApiUser(["admin"]);

  if (auth.response) {
    return auth.response;
  }

  const users = await listAdminUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiUser(["admin"]);

  if (auth.response) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      role?: AdminRole;
    };
    const users = await createAdminUser({
      email: body.email ?? "",
      password: body.password ?? "",
      role: body.role ?? "viewer",
    });

    return NextResponse.json({ ok: true, users });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create user.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
