import { NextResponse } from "next/server";
import { updateCurrentUserProfile } from "@/lib/auth";
import { requireAuthenticatedApiUser } from "@/lib/admin-api";

export async function PATCH(request: Request) {
  const auth = await requireAuthenticatedApiUser();

  if (auth.response) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      image?: string | null;
    };
    const user = await updateCurrentUserProfile(auth.user.id, {
      name: body.name,
      image: body.image,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update profile.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
