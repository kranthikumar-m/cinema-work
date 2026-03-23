import { NextResponse } from "next/server";
import {
  authenticateUser,
  createSessionForUser,
  getSessionCookieName,
  userHasAdminAccess,
} from "@/lib/auth";
import {
  clearRateLimit,
  consumeRateLimit,
  getRequestClientId,
} from "@/lib/auth-rate-limit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
      next?: string;
    };
    const normalizedIdentifier = body.identifier?.trim().toLowerCase() ?? "";
    const rateLimitKey = `${getRequestClientId(request)}:${normalizedIdentifier}`;
    const rateLimit = consumeRateLimit("auth-login", rateLimitKey, {
      limit: 5,
      windowMs: 1000 * 60 * 10,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many sign-in attempts. Please wait before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          },
        }
      );
    }

    const user = await authenticateUser(normalizedIdentifier, body.password ?? "");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username, email, or password." },
        { status: 401 }
      );
    }

    clearRateLimit("auth-login", rateLimitKey);
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
      error instanceof Error ? error.message : "Unable to sign in.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
