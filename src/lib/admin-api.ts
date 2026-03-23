import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type {
  AdminSessionUser,
  AdminStoredUserRole,
} from "@/types/admin";
import type { AuthUser } from "@/types/auth";

type AuthenticatedApiAuthResult =
  | {
      user: AuthUser;
      response: null;
    }
  | {
      user: null;
      response: NextResponse;
    };

type AdminApiAuthResult =
  | {
      user: AdminSessionUser;
      response: null;
    }
  | {
      user: null;
      response: NextResponse;
    };

export async function requireAuthenticatedApiUser(): Promise<AuthenticatedApiAuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  if (!user.isActive) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "This account has been disabled." },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}

export async function requireAdminApiUser(
  allowedRoles: AdminStoredUserRole[] = ["admin", "editor"]
): Promise<AdminApiAuthResult> {
  const auth = await requireAuthenticatedApiUser();

  if (auth.response) {
    return { user: null, response: auth.response };
  }

  const user = auth.user;

  if (!allowedRoles.includes(user.storedRole)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { user, response: null };
}
