import { NextResponse } from "next/server";
import {
  authenticateAdminUser,
  createSessionForUser,
  getSessionCookieName,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
    };
    const identifier = body.identifier?.trim() ?? "";
    const password = body.password ?? "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required." },
        { status: 400 }
      );
    }

    const user = await authenticateAdminUser(identifier, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username, email, or password." },
        { status: 401 }
      );
    }

    const session = await createSessionForUser(user.id);
    const response = NextResponse.json({
      ok: true,
      role: user.role,
      redirectTo: "/admin",
    });

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

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
