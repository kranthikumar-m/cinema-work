import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import type { AdminRole, AdminSessionUser } from "@/types/admin";

type AdminApiAuthResult =
  | {
      user: AdminSessionUser;
      response: null;
    }
  | {
      user: null;
      response: NextResponse;
    };

export async function requireAdminApiUser(
  allowedRoles: AdminRole[] = ["admin", "editor"]
): Promise<AdminApiAuthResult> {
  const user = await getCurrentAdminUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { user, response: null };
}
