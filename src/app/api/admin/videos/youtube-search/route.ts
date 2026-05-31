import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { env } from "@/lib/env";
import type { YouTubeSearchResult } from "@/types/admin";

/**
 * Translates a non-OK YouTube Data API response into a precise, user-facing
 * message + status. YouTube reports the real cause in `error.errors[0].reason`
 * (e.g. quotaExceeded, keyInvalid, accessNotConfigured), which is far more
 * actionable than the raw HTTP status.
 */
async function describeYouTubeError(
  res: Response
): Promise<{ status: number; message: string }> {
  let reason = "";
  let apiMessage = "";
  try {
    const body = await res.json();
    reason = body?.error?.errors?.[0]?.reason ?? "";
    apiMessage = body?.error?.message ?? "";
  } catch {
    // Non-JSON body — fall back to a status-based message below.
  }

  switch (reason) {
    case "quotaExceeded":
    case "dailyLimitExceeded":
    case "rateLimitExceeded":
    case "userRateLimitExceeded":
      return {
        status: 429,
        message:
          "YouTube search quota is exhausted for today (resets at midnight Pacific Time). You can still add a video by pasting its YouTube URL or video ID.",
      };
    case "keyInvalid":
    case "badRequest":
      return {
        status: 502,
        message:
          "The configured YouTube API key is invalid. Check YOUTUBE_API_KEY in your environment.",
      };
    case "accessNotConfigured":
    case "forbidden":
    case "ipRefererBlocked":
      return {
        status: 502,
        message:
          "YouTube access is not enabled for this API key. Enable the “YouTube Data API v3” in the key's Google Cloud project and remove any HTTP-referrer restriction.",
      };
    default:
      return {
        status: 502,
        message: apiMessage
          ? `YouTube API error: ${apiMessage}`
          : `YouTube API error (HTTP ${res.status}).`,
      };
  }
}

export async function GET(request: Request) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  if (!env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YouTube API key is not configured. Set YOUTUBE_API_KEY in your environment." },
      { status: 500 }
    );
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "15");
    url.searchParams.set("key", env.YOUTUBE_API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const { status, message } = await describeYouTubeError(res);
      return NextResponse.json({ error: message }, { status });
    }

    const data = await res.json();

    const results: YouTubeSearchResult[] = (data.items ?? []).map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          thumbnails: { medium?: { url: string }; default?: { url: string } };
          channelTitle: string;
        };
      }) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnailUrl:
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.default?.url ??
          "",
        channelTitle: item.snippet.channelTitle,
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
