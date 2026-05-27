import { NextResponse } from "next/server";
import {
  createSessionForUser,
  getSessionCookieName,
  registerUser,
  userHasAdminAccess,
} from "@/lib/auth";
import { consumeRateLimit, getRequestClientId } from "@/lib/auth-rate-limit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      next?: string;
    };
    const rateLimit = consumeRateLimit(
      "auth-register",
      getRequestClientId(request),
      {
        limit: 5,
        windowMs: 1000 * 60 * 30,
      }
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please wait before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          },
        }
      );
    }

    const user = await registerUser({
      name: body.name,
      email: body.email ?? "",
      password: body.password ?? "",
    });
    const session = await createSessionForUser(user.id);
    const redirectTo =
      body.next?.startsWith("/") && !body.next.startsWith("//")
        ? body.next
        : userHasAdminAccess(user.storedRole)
          ? "/admin"
          : "/account";

    const response = NextResponse.json({ ok: true, redirectTo, user });
    response.cookies.set({
      name: getSessionCookieName(),
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(session.expiresAt),
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create account.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
