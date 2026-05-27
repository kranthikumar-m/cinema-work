import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  listMovieVideoRecords,
  insertMovieVideoRecord,
  deleteMovieVideoRecord,
} from "@/lib/database";
import type { VideoCategory } from "@/types/admin";

interface RouteContext {
  params: { id: string };
}

const VALID_CATEGORIES: VideoCategory[] = ["trailer", "teaser", "review", "miscellaneous"];

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const rows = await listMovieVideoRecords(movieId);
    const results = rows.map((r) => ({
      id: r.id,
      movieId: r.movie_id,
      youtubeKey: r.youtube_key,
      title: r.title,
      category: r.category,
      addedByUserId: r.added_by_user_id,
      createdAt: r.created_at,
    }));
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list videos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { youtubeKey, title, category } = body as {
      youtubeKey?: string;
      title?: string;
      category?: string;
    };

    if (!youtubeKey || !title) {
      return NextResponse.json({ error: "youtubeKey and title are required." }, { status: 400 });
    }

    if (!category || !VALID_CATEGORIES.includes(category as VideoCategory)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    const record = await insertMovieVideoRecord({
      movieId,
      youtubeKey,
      title,
      category,
      addedByUserId: auth.user.id,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const videoId = Number(searchParams.get("videoId"));

    if (!Number.isFinite(videoId)) {
      return NextResponse.json({ error: "videoId query param required." }, { status: 400 });
    }

    await deleteMovieVideoRecord(videoId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
