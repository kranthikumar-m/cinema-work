import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import { getCustomImageRecordsByMovieId } from "@/lib/database";
import { getMovieDetails, getMovieImages } from "@/services/tmdb";
import { getMoviePosterUrl } from "@/lib/utils";
import type { MovieCustomImagesPayload, CustomImageRecord } from "@/types/admin";

interface RouteContext {
  params: { id: string };
}

function mapRow(row: {
  id: number;
  movie_id: number;
  image_type: "poster" | "backdrop";
  file_name: string;
  mime_type: string;
  uploaded_by_user_id: number | null;
  created_at: string;
}): CustomImageRecord {
  return {
    id: row.id,
    movieId: row.movie_id,
    imageType: row.image_type,
    fileName: row.file_name,
    mimeType: row.mime_type,
    uploadedByUserId: row.uploaded_by_user_id,
    createdAt: row.created_at,
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const [movie, images, customRows] = await Promise.all([
      getMovieDetails(movieId),
      getMovieImages(movieId).catch(() => ({ backdrops: [], posters: [] })),
      getCustomImageRecordsByMovieId(movieId),
    ]);

    const posterUrl = getMoviePosterUrl(movie, "w300");
    const hasTmdbPoster = Boolean(movie.poster_path);
    const hasTmdbBackdrop = images.backdrops.length > 0 || Boolean(movie.backdrop_path);

    const customPosterRow = customRows.find((r) => r.image_type === "poster") ?? null;
    const customBackdropRow = customRows.find((r) => r.image_type === "backdrop") ?? null;

    const payload: MovieCustomImagesPayload = {
      movieId: movie.id,
      title: movie.title,
      posterUrl: posterUrl || null,
      backdropUrl: hasTmdbBackdrop
        ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
        : null,
      hasTmdbPoster,
      hasTmdbBackdrop,
      customPoster: customPosterRow ? mapRow(customPosterRow) : null,
      customBackdrop: customBackdropRow ? mapRow(customBackdropRow) : null,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load custom images.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
