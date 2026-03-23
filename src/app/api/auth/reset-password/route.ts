import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
    };
    await resetPasswordWithToken(body.token ?? "", body.password ?? "");

    return NextResponse.json({
      ok: true,
      redirectTo: "/login?reset=1",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset password.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
