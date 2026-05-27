"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Search, Trash2, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminMovieSearchResult, MovieCustomImagesPayload } from "@/types/admin";

type ImageType = "poster" | "backdrop";

function ImageSlot({
  label,
  imageType,
  movieId,
  tmdbUrl,
  hasTmdb,
  customRecord,
  saving,
  onUpload,
  onDelete,
}: {
  label: string;
  imageType: ImageType;
  movieId: number;
  tmdbUrl: string | null;
  hasTmdb: boolean;
  customRecord: MovieCustomImagesPayload["customPoster"];
  saving: boolean;
  onUpload: (movieId: number, imageType: ImageType, file: File) => Promise<void>;
  onDelete: (movieId: number, imageType: ImageType) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const customUrl = customRecord
    ? `/api/images/custom/${movieId}/${imageType}?t=${Date.parse(customRecord.createdAt)}`
    : null;

  const displayUrl = customUrl || tmdbUrl;
  const source = customRecord ? "custom upload" : hasTmdb ? "TMDB" : "missing";
  const isMissing = !customRecord && !hasTmdb;
  const aspectClass = imageType === "poster" ? "aspect-[2/3]" : "aspect-[16/9]";

  function handleFileSelect(files: FileList | null) {
    const file = files?.[0];
    if (file) onUpload(movieId, imageType, file);
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.48)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-[var(--color-text)]">{label}</h4>
          {isMissing ? (
            <span className="flex items-center gap-1 rounded-full bg-[rgba(220,120,40,0.15)] px-2.5 py-0.5 text-[11px] font-medium text-[#f0a050]">
              <AlertTriangle className="h-3 w-3" />
              Missing
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-[rgba(60,180,100,0.12)] px-2.5 py-0.5 text-[11px] font-medium text-[#60c880]">
              <CheckCircle2 className="h-3 w-3" />
              {customRecord ? "Custom" : "TMDB"}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[var(--color-muted-strong)]">
          Source: {source}
        </p>
      </div>

      <div
        className={`relative ${aspectClass} overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-deep)] ${
          dragOver ? "ring-2 ring-[var(--color-accent)]" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileSelect(e.dataTransfer.files);
        }}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={label}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--color-muted-strong)]">
            <ImagePlus className="h-8 w-8" />
            <p className="text-xs">No image available</p>
            <p className="text-[10px]">Drag & drop or click below</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Button
          type="button"
          size="sm"
          className="flex-1 gap-1.5"
          disabled={saving}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {customRecord ? "Replace" : "Upload"}
        </Button>
        {customRecord && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 text-red-400 hover:text-red-300"
            disabled={saving}
            onClick={() => onDelete(movieId, imageType)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdminImageUploader() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminMovieSearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<AdminMovieSearchResult | null>(null);
  const [imageData, setImageData] = useState<MovieCustomImagesPayload | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/admin/movies/search?q=${encodeURIComponent(query)}`
      );
      const payload = (await response.json()) as {
        error?: string;
        results?: AdminMovieSearchResult[];
      };

      if (!response.ok || !payload.results) {
        throw new Error(payload.error || "Unable to search movies.");
      }

      setResults(payload.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to search movies.");
    } finally {
      setSearching(false);
    }
  }

  async function loadCustomImages(movie: AdminMovieSearchResult) {
    setSelectedMovie(movie);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/movies/${movie.id}/custom-images`);
      const payload = (await response.json()) as MovieCustomImagesPayload & { error?: string };

      if (!response.ok || !payload.movieId) {
        throw new Error(payload.error || "Unable to load image data.");
      }

      setImageData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load image data.");
      setImageData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(movieId: number, imageType: ImageType, file: File) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("imageType", imageType);
      formData.append("file", file);

      const response = await fetch(`/api/admin/movies/${movieId}/custom-image`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Upload failed.");
      }

      setSuccess(`${imageType === "poster" ? "Poster" : "Backdrop"} uploaded successfully.`);

      if (selectedMovie) await loadCustomImages(selectedMovie);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(movieId: number, imageType: ImageType) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/admin/movies/${movieId}/custom-image?imageType=${imageType}`,
        { method: "DELETE" }
      );

      const payload = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Delete failed.");
      }

      setSuccess(`${imageType === "poster" ? "Poster" : "Backdrop"} removed.`);

      if (selectedMovie) await loadCustomImages(selectedMovie);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
          Custom Image Uploads
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-strong)]">
          Upload custom poster or backdrop images for movies that are missing artwork from TMDB.
          Uploaded images take priority over TMDB defaults on movie pages.
        </p>
      </div>

      <form onSubmit={runSearch} className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies by title or TMDB id"
            className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] pl-12 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
          />
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]" />
        </div>
        <Button type="submit" size="lg" disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </Button>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl border border-[rgba(60,180,100,0.28)] bg-[rgba(28,80,48,0.28)] px-4 py-3 text-sm text-[#c0f0d0]">
          {success}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Search Results */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] p-3">
          <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Search Results
          </div>
          <div className="space-y-2">
            {results.length ? (
              results.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => loadCustomImages(movie)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    selectedMovie?.id === movie.id
                      ? "border-[rgba(194,154,98,0.42)] bg-[rgba(194,154,98,0.08)]"
                      : "border-transparent bg-transparent hover:border-[var(--color-border)] hover:bg-white/2"
                  }`}
                >
                  <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
                    {movie.posterUrl ? (
                      <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImagePlus className="h-4 w-4 text-[var(--color-muted)]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      {movie.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
                      {movie.releaseDate || "Release TBA"} |{" "}
                      {movie.originalLanguage.toUpperCase()}
                    </p>
                    {!movie.posterUrl && !movie.backdropPath && (
                      <p className="mt-1 text-[11px] text-[#f0a050]">
                        Missing images
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted-strong)]">
                Search for a movie to manage its images.
              </div>
            )}
          </div>
        </div>

        {/* Image Management Panel */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] p-4">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-[var(--color-muted-strong)]">
              Loading image data...
            </div>
          ) : imageData ? (
            <div>
              <div className="mb-5">
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-text)]">
                  {imageData.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted-strong)]">
                  TMDB ID: {imageData.movieId}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <ImageSlot
                  label="Poster"
                  imageType="poster"
                  movieId={imageData.movieId}
                  tmdbUrl={imageData.posterUrl}
                  hasTmdb={imageData.hasTmdbPoster}
                  customRecord={imageData.customPoster}
                  saving={saving}
                  onUpload={handleUpload}
                  onDelete={handleDelete}
                />
                <ImageSlot
                  label="Backdrop"
                  imageType="backdrop"
                  movieId={imageData.movieId}
                  tmdbUrl={imageData.backdropUrl}
                  hasTmdb={imageData.hasTmdbBackdrop}
                  customRecord={imageData.customBackdrop}
                  saving={saving}
                  onUpload={handleUpload}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted-strong)]">
              Select a movie on the left to manage its poster and backdrop images.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
