import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { env } from "@/lib/env";
import type { YouTubeSearchResult } from "@/types/admin";

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
      const body = await res.text();
      throw new Error(`YouTube API error: ${res.status} ${body}`);
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
