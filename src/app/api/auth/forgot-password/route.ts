import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth";
import { consumeRateLimit, getRequestClientId } from "@/lib/auth-rate-limit";
import { sendPasswordResetEmail } from "@/services/auth-mail";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim() ?? "";
    const rateLimitKey = `${getRequestClientId(request)}:${email.toLowerCase()}`;
    const rateLimit = consumeRateLimit("auth-forgot-password", rateLimitKey, {
      limit: 5,
      windowMs: 1000 * 60 * 15,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many reset requests. Please wait before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          },
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(email);

    if (result.resetUrl) {
      await sendPasswordResetEmail({ email, resetUrl: result.resetUrl });
    }

    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, password reset instructions have been prepared.",
      resetUrl:
        process.env.NODE_ENV === "production" ? null : result.resetUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start password reset.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
