import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  listMovieVideoRecords,
  insertMovieVideoRecord,
  deleteMovieVideoRecord,
  addHiddenVideoKey,
  removeHiddenVideoKey,
} from "@/lib/database";
import type { VideoCategory } from "@/types/admin";

interface RouteContext {
  params: { id: string };
}

const VALID_CATEGORIES: VideoCategory[] = ["trailer", "teaser", "song", "review", "miscellaneous"];

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

/**
 * Removes a video from a movie's detail page. Pass `videoId` to delete an
 * admin-added custom row, and/or `youtubeKey` to suppress a video by key
 * (TMDB / auto-fetched videos have no row, so they're hidden via the
 * movie_hidden_videos set). At least one is required.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const videoIdParam = searchParams.get("videoId");
    const youtubeKey = searchParams.get("youtubeKey")?.trim() || "";
    const videoId = videoIdParam != null ? Number(videoIdParam) : NaN;

    if (!youtubeKey && !Number.isFinite(videoId)) {
      return NextResponse.json(
        { error: "youtubeKey or videoId query param required." },
        { status: 400 }
      );
    }

    if (youtubeKey) {
      await addHiddenVideoKey({
        movieId,
        youtubeKey,
        createdAt: new Date().toISOString(),
      });
    }
    if (Number.isFinite(videoId)) {
      await deleteMovieVideoRecord(videoId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * "Fix match" — replaces a wrongly-matched video with an admin-chosen one.
 * The old key is suppressed (and its custom row, if any, deleted) and the new
 * video is added as an admin-curated row under the same category.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { oldKey, oldRecordId, newKey, newTitle, category } = body as {
      oldKey?: string;
      oldRecordId?: number | null;
      newKey?: string;
      newTitle?: string;
      category?: string;
    };

    if (!oldKey || !newKey || !newTitle) {
      return NextResponse.json(
        { error: "oldKey, newKey and newTitle are required." },
        { status: 400 }
      );
    }
    if (!category || !VALID_CATEGORIES.includes(category as VideoCategory)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Suppress the old match (covers TMDB / auto-fetched videos)…
    if (oldKey !== newKey) {
      await addHiddenVideoKey({
        movieId,
        youtubeKey: oldKey,
        createdAt: new Date().toISOString(),
      });
    }
    // …drop its custom row if it had one…
    if (typeof oldRecordId === "number" && Number.isFinite(oldRecordId)) {
      await deleteMovieVideoRecord(oldRecordId);
    }
    // …make sure the replacement isn't itself suppressed, then add it.
    await removeHiddenVideoKey(movieId, newKey);
    const record = await insertMovieVideoRecord({
      movieId,
      youtubeKey: newKey,
      title: newTitle,
      category,
      addedByUserId: auth.user.id,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fix the video match.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
