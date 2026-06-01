"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, ThumbsUp, Youtube } from "lucide-react";
import type { MovieAlbumInfo, MovieSong } from "@/services/movie-music";

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatCount(value: number | null): string | null {
  if (value == null) return null;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

interface MusicPlayerClientProps {
  movieTitle: string;
  albumImage: string;
  album: MovieAlbumInfo | null;
  songs: MovieSong[];
  cast: string[];
}

export function MusicPlayerClient({
  movieTitle,
  albumImage,
  album,
  songs,
  cast,
}: MusicPlayerClientProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!songs.length) {
    return (
      <div className="app-page-shell py-20 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{movieTitle}</h1>
        <p className="mt-4 text-[var(--color-muted-strong)]">
          No soundtrack was found for this title yet.
        </p>
      </div>
    );
  }

  const selected = songs[Math.min(selectedIndex, songs.length - 1)];
  const views = formatCount(selected.youtubeViews);
  const likes = formatCount(selected.youtubeLikes);
  const isRemoteImage = /^https?:\/\//.test(albumImage);

  return (
    <div className="app-page-shell py-8">
      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* Left — album art + credits */}
        <aside className="space-y-6">
          <div className="mx-auto h-48 w-48 overflow-hidden rounded-full ring-2 ring-[var(--color-border)] lg:mx-0">
            <Image
              src={albumImage}
              alt={movieTitle}
              width={192}
              height={192}
              className="h-full w-full object-cover"
              unoptimized={isRemoteImage}
            />
          </div>
          <dl className="space-y-4 text-sm">
            <MetaRow label="Album" value={album?.name ?? movieTitle} />
            <MetaRow label="Singers" value={selected.artists.join(", ")} />
            <MetaRow label="Lyricist" value={null} />
            <MetaRow label="Music" value={album?.musicDirector} />
            <MetaRow label="Music-Label" value={album?.label} />
            <MetaRow label="Cast" value={cast.join(", ")} />
          </dl>
        </aside>

        {/* Center — song title, stats, lyrics */}
        <section className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Song
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--color-text)] md:text-3xl">
            {selected.title}{" "}
            <span className="text-[var(--color-muted)]">— {movieTitle}</span>
          </h1>
          <div className="mt-3 flex items-center gap-5 text-sm text-[var(--color-muted-strong)]">
            {views && (
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {views}
              </span>
            )}
            {likes && (
              <span className="inline-flex items-center gap-1.5">
                <ThumbsUp className="h-4 w-4" />
                {likes}
              </span>
            )}
          </div>

          <div className="mt-6 whitespace-pre-line text-[15px] leading-[1.9] text-[var(--color-muted-strong)]">
            {selected.lyrics
              ? selected.lyrics
              : "Lyrics are not available for this song yet."}
          </div>
        </section>

        {/* Right — song list + video */}
        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-text)]">
              {songs.length} {songs.length === 1 ? "Song" : "Songs"}
            </h2>
            <Youtube className="h-5 w-5 text-red-500" />
          </div>

          <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)]">
            {songs.map((song, index) => {
              const active = index === selectedIndex;
              return (
                <li key={song.spotifyId}>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition ${
                      active
                        ? "bg-[var(--color-accent-soft)]"
                        : "hover:bg-[rgba(255,255,255,0.03)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-semibold ${
                          active ? "text-[var(--color-accent-strong)]" : "text-[var(--color-text)]"
                        }`}
                      >
                        {song.title}
                      </p>
                      {song.artists.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                          {song.artists.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[var(--color-muted)]">
                      {formatDuration(song.durationMs)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected.youtubeKey ? (
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <iframe
                key={selected.youtubeKey}
                src={`https://www.youtube.com/embed/${selected.youtubeKey}`}
                title={selected.title}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="rounded-xl border border-[var(--color-border)] px-4 py-6 text-center text-xs text-[var(--color-muted)]">
              No video found for this song.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</dt>
      <dd className="mt-1 text-[var(--color-text)]">{value && value.trim() ? value : "—"}</dd>
    </div>
  );
}
