import { NextResponse } from "next/server";
import { createUserByAdmin, listUsers } from "@/lib/auth";
import { requireAdminApiUser } from "@/lib/admin-api";
import type { ManageableUserRole } from "@/types/admin";

export async function GET(request: Request) {
  const auth = await requireAdminApiUser(["admin"]);

  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const roleValue = searchParams.get("role") ?? "all";
  const statusValue = searchParams.get("status") ?? "all";
  const role =
    roleValue === "admin" || roleValue === "user" ? roleValue : "all";
  const status =
    statusValue === "active" || statusValue === "disabled"
      ? statusValue
      : "all";

  const users = await listUsers({ query, role, status });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiUser(["admin"]);

  if (auth.response) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: ManageableUserRole;
      isActive?: boolean;
    };
    const user = await createUserByAdmin({
      name: body.name,
      email: body.email ?? "",
      password: body.password ?? "",
      role: body.role ?? "user",
      isActive: body.isActive,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create user.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
