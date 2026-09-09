"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Trash2, Play, Film, Music, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { YouTubeSearchResult, MovieVideoRecord, VideoCategory } from "@/types/admin";
import type { AdminMovieSearchResult } from "@/types/admin";
import { VIDEO_CATEGORIES, VIDEO_CATEGORY_SINGULAR } from "@/lib/video-category";

const CATEGORIES: { value: VideoCategory; label: string }[] = VIDEO_CATEGORIES.map((value) => ({
  value,
  label: VIDEO_CATEGORY_SINGULAR[value],
}));

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    trailer: "bg-[rgba(194,154,98,0.15)] text-[var(--color-accent)]",
    teaser: "bg-[rgba(100,160,255,0.12)] text-[#80b0ff]",
    song: "bg-[rgba(255,120,180,0.12)] text-[#ff80b4]",
    lyrical: "bg-[rgba(255,120,180,0.12)] text-[#ff80b4]",
    promo: "bg-[rgba(100,160,255,0.12)] text-[#80b0ff]",
    interview: "bg-[rgba(180,140,220,0.12)] text-[#b88cdc]",
    event: "bg-[rgba(240,180,80,0.12)] text-[#f0c060]",
    bts: "bg-[rgba(120,200,220,0.12)] text-[#80d0e0]",
    review: "bg-[rgba(60,180,100,0.12)] text-[#60c880]",
    miscellaneous: "bg-[rgba(180,140,220,0.12)] text-[#b88cdc]",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${colors[category] || colors.miscellaneous}`}>
      {category}
    </span>
  );
}

interface SongResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export function AdminVideoManager() {
  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState<AdminMovieSearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<AdminMovieSearchResult | null>(null);
  const [searchingMovies, setSearchingMovies] = useState(false);

  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<YouTubeSearchResult[]>([]);
  const [searchingYt, setSearchingYt] = useState(false);

  const [songResults, setSongResults] = useState<SongResult[]>([]);
  const [fetchingSongs, setFetchingSongs] = useState(false);
  const [songsFetched, setSongsFetched] = useState(false);

  const [addedVideos, setAddedVideos] = useState<MovieVideoRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>("trailer");

  const loadAddedVideos = useCallback(async (movieId: number) => {
    try {
      const res = await fetch(`/api/admin/movies/${movieId}/videos`);
      const data = (await res.json()) as { results?: MovieVideoRecord[] };
      if (data.results) setAddedVideos(data.results);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (selectedMovie) {
      loadAddedVideos(selectedMovie.id);
      setYtQuery(selectedMovie.title + " Telugu");
      setSongResults([]);
      setSongsFetched(false);
    }
  }, [selectedMovie, loadAddedVideos]);

  async function searchMovies(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchingMovies(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/movies/search?q=${encodeURIComponent(movieQuery)}`);
      const data = (await res.json()) as { error?: string; results?: AdminMovieSearchResult[] };
      if (!res.ok || !data.results) throw new Error(data.error || "Search failed.");
      setMovieResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Movie search failed.");
    } finally {
      setSearchingMovies(false);
    }
  }

  async function searchYoutube(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchingYt(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/videos/youtube-search?q=${encodeURIComponent(ytQuery)}`);
      const data = (await res.json()) as { error?: string; results?: YouTubeSearchResult[] };
      if (!res.ok || !data.results) throw new Error(data.error || "YouTube search failed.");
      setYtResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "YouTube search failed.");
    } finally {
      setSearchingYt(false);
    }
  }

  async function fetchSongs() {
    if (!selectedMovie) return;
    setFetchingSongs(true);
    setError(null);
    setSuccess(null);
    try {
      const params = new URLSearchParams({ title: selectedMovie.title });
      if (selectedMovie.releaseDate) params.set("releaseDate", selectedMovie.releaseDate);
      const res = await fetch(`/api/admin/videos/song-search?${params}`);
      const data = (await res.json()) as { error?: string; results?: SongResult[] };
      if (!res.ok || !data.results) throw new Error(data.error || "Song search failed.");
      setSongResults(data.results);
      setSongsFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Song search failed.");
    } finally {
      setFetchingSongs(false);
    }
  }

  async function addVideo(yt: YouTubeSearchResult | SongResult, category: VideoCategory) {
    if (!selectedMovie) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/movies/${selectedMovie.id}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeKey: yt.videoId,
          title: yt.title,
          category,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to add video.");
      setSuccess(`"${yt.title}" added as ${category}.`);
      await loadAddedVideos(selectedMovie.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add video.");
    } finally {
      setSaving(false);
    }
  }

  async function removeVideo(video: MovieVideoRecord) {
    if (!selectedMovie) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/movies/${selectedMovie.id}/videos?videoId=${video.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to remove video.");
      setSuccess(`"${video.title}" removed.`);
      await loadAddedVideos(selectedMovie.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove video.");
    } finally {
      setSaving(false);
    }
  }

  const addedKeys = new Set(addedVideos.map((v) => v.youtubeKey));

  return (
    <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
          Manage Movie Videos
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-strong)]">
          Search for a movie, then search YouTube to find and add trailers, teasers, reviews, and other videos.
          Use &quot;Fetch Songs&quot; to auto-discover songs filtered by relevance.
        </p>
      </div>

      {/* Step 1: Select a movie */}
      {!selectedMovie ? (
        <>
          <form onSubmit={searchMovies} className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <input
                type="search"
                value={movieQuery}
                onChange={(e) => setMovieQuery(e.target.value)}
                placeholder="Search for a movie to manage videos..."
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] pl-12 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
              />
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]" />
            </div>
            <Button type="submit" size="lg" disabled={searchingMovies}>
              {searchingMovies ? "Searching..." : "Search"}
            </Button>
          </form>

          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {movieResults.map((movie) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => {
                  setSelectedMovie(movie);
                  setMovieResults([]);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 py-3 text-left hover:border-[var(--color-border)] hover:bg-white/2 transition"
              >
                <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
                  {movie.posterUrl ? (
                    <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Film className="h-4 w-4 text-[var(--color-muted)]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">{movie.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted-strong)]">{movie.releaseDate || "Release TBA"}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Selected movie header */}
          <div className="mb-5 flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] px-4 py-3">
            <div className="relative h-14 w-10 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
              {selectedMovie.posterUrl ? (
                <Image src={selectedMovie.posterUrl} alt={selectedMovie.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Film className="h-4 w-4 text-[var(--color-muted)]" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-text)]">{selectedMovie.title}</p>
              <p className="text-xs text-[var(--color-muted-strong)]">{selectedMovie.releaseDate || "Release TBA"}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedMovie(null);
                setYtResults([]);
                setSongResults([]);
                setSongsFetched(false);
                setAddedVideos([]);
                setError(null);
                setSuccess(null);
              }}
            >
              Change Movie
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl border border-[rgba(60,180,100,0.28)] bg-[rgba(28,80,48,0.28)] px-4 py-3 text-sm text-[#c0f0d0]">
              {success}
            </div>
          )}

          {/* Fetch Songs button */}
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-[rgba(255,120,180,0.18)] bg-[rgba(255,120,180,0.04)] px-4 py-3">
            <Music className="h-5 w-5 shrink-0 text-[#ff80b4]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)]">Song Discovery</p>
              <p className="text-xs text-[var(--color-muted-strong)]">
                Auto-search YouTube for songs matching this movie, filtered by relevance, duration, and release year.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={fetchingSongs}
              onClick={fetchSongs}
              className="gap-1.5 shrink-0"
            >
              <Music className="h-3.5 w-3.5" />
              {fetchingSongs ? "Searching..." : "Fetch Songs"}
            </Button>
          </div>

          {/* Song Results */}
          {songsFetched && (
            <div className="mb-5 rounded-2xl border border-[rgba(255,120,180,0.18)] bg-[rgba(15,19,34,0.44)] p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.16em] text-[#ff80b4]">
                  Song Results ({songResults.length})
                </div>
                {songResults.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSongResults([]); setSongsFetched(false); }}
                    className="text-xs text-[var(--color-muted-strong)] hover:text-[var(--color-text)]"
                  >
                    Dismiss
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {songResults.length ? (
                  songResults.map((song) => {
                    const alreadyAdded = addedKeys.has(song.videoId);
                    return (
                      <div
                        key={song.videoId}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                          alreadyAdded
                            ? "border-[rgba(60,180,100,0.2)] bg-[rgba(28,80,48,0.12)]"
                            : "border-transparent hover:border-[var(--color-border)] hover:bg-white/2"
                        }`}
                      >
                        <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
                          <Image src={song.thumbnailUrl} alt={song.title} fill className="object-cover" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)]">{song.title}</p>
                          <p className="mt-1 text-xs text-[var(--color-muted-strong)]">{song.channelTitle}</p>
                        </div>
                        {alreadyAdded ? (
                          <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-[rgba(60,180,100,0.15)] px-3 py-1.5 text-xs font-medium text-[#60c880]">
                            <Check className="h-3 w-3" />
                            Added
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            disabled={saving}
                            onClick={() => addVideo(song, "song")}
                            className="gap-1 shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Song
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted-strong)]">
                    No matching songs found for this movie.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* YouTube search + category selector */}
          <form onSubmit={searchYoutube} className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <input
                type="search"
                value={ytQuery}
                onChange={(e) => setYtQuery(e.target.value)}
                placeholder="Search YouTube for videos..."
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] pl-12 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
              />
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as VideoCategory)}
              className="h-12 rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-4 text-sm text-[var(--color-text)] outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <Button type="submit" size="lg" disabled={searchingYt}>
              {searchingYt ? "Searching..." : "Search YouTube"}
            </Button>
          </form>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            {/* YouTube Results */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] p-3">
              <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                YouTube Results
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {ytResults.length ? (
                  ytResults.map((yt) => {
                    const alreadyAdded = addedKeys.has(yt.videoId);
                    return (
                      <div
                        key={yt.videoId}
                        className="flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 py-3 hover:border-[var(--color-border)] hover:bg-white/2"
                      >
                        <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
                          {yt.thumbnailUrl ? (
                            <Image src={yt.thumbnailUrl} alt={yt.title} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Play className="h-4 w-4 text-[var(--color-muted)]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)]">{yt.title}</p>
                          <p className="mt-1 text-xs text-[var(--color-muted-strong)]">{yt.channelTitle}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={saving || alreadyAdded}
                          onClick={() => addVideo(yt, selectedCategory)}
                          className="gap-1 shrink-0"
                        >
                          {alreadyAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          {alreadyAdded ? "Added" : "Add"}
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted-strong)]">
                    Search YouTube to find videos for this movie.
                  </div>
                )}
              </div>
            </div>

            {/* Added Videos */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] p-3">
              <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Added Videos ({addedVideos.length})
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {addedVideos.length ? (
                  addedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 py-3"
                    >
                      <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
                        <Image
                          src={`https://img.youtube.com/vi/${video.youtubeKey}/mqdefault.jpg`}
                          alt={video.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)]">{video.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <CategoryBadge category={video.category} />
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => removeVideo(video)}
                        className="gap-1 shrink-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted-strong)]">
                    No videos added for this movie yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
