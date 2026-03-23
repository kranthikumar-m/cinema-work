import { NextResponse } from "next/server";
import { deleteSession, getSessionCookieName } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${getSessionCookieName()}=`))
    ?.split("=")[1];

  await deleteSession(sessionCookie);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
