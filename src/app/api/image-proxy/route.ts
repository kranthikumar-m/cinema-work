import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BLOCKED_HOST_PATTERNS = [/^localhost$/i, /^127\./, /^0\.0\.0\.0$/, /^\[?::1\]?$/i];

function isAllowedRemoteUrl(url: URL) {
  if (url.protocol !== "https:") {
    return false;
  }

  return !BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname));
}

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing image URL." }, { status: 400 });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
  }

  if (!isAllowedRemoteUrl(parsedUrl)) {
    return NextResponse.json({ error: "Blocked image URL." }, { status: 400 });
  }

  const upstream = await fetch(parsedUrl.toString(), {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
    next: { revalidate: 86400 },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Unable to fetch remote image." },
      { status: upstream.status }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";

  if (!contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Remote URL did not return an image." },
      { status: 415 }
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Type": contentType,
    },
  });
}
