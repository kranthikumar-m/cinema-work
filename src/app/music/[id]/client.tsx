"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, ThumbsUp, Youtube, Share2, Check, AudioLines } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

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

  async function shareSong() {
    const url = selected.youtubeKey
      ? `https://www.youtube.com/watch?v=${selected.youtubeKey}`
      : (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (navigator.share) {
        await navigator.share({ title: `${selected.title} — ${movieTitle}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user dismissed share */
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-84px)] overflow-hidden">
      {/* Immersive blurred backdrop from the album art */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={albumImage}
          alt=""
          fill
          aria-hidden
          className="scale-110 object-cover opacity-25 blur-2xl"
          unoptimized={isRemoteImage}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,39,0.82)_0%,rgba(20,24,39,0.92)_55%,var(--color-bg)_100%)]" />
      </div>

      <div className="app-page-shell py-10">
        <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)_380px]">
          {/* Left — album art + credits */}
          <aside className="space-y-7">
            <div className="mx-auto aspect-square w-52 overflow-hidden rounded-full shadow-[0_24px_70px_rgba(7,10,18,0.55)] ring-2 ring-[rgba(194,154,98,0.4)] lg:mx-0">
              <Image
                src={albumImage}
                alt={movieTitle}
                width={208}
                height={208}
                className="h-full w-full object-cover"
                unoptimized={isRemoteImage}
                priority
              />
            </div>
            <dl className="space-y-4">
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
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Song
            </p>
            <h1 className="mt-1.5 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-text)] md:text-[2rem] md:leading-tight">
              {selected.title}
              <span className="font-normal text-[var(--color-muted)]"> — {movieTitle}</span>
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-[var(--color-muted-strong)]">
              {views && (
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-[var(--color-accent)]" />
                  {views}
                </span>
              )}
              {likes && (
                <span className="inline-flex items-center gap-1.5">
                  <ThumbsUp className="h-4 w-4 text-[var(--color-accent)]" />
                  {likes}
                </span>
              )}
              <button
                type="button"
                onClick={shareSong}
                className="inline-flex items-center gap-1.5 text-[var(--color-muted-strong)] transition hover:text-[var(--color-text)]"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[var(--color-accent)]" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Share"}
              </button>
            </div>

            <div className="mt-8">
              {selected.youtubeKey ? (
                <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[0_24px_70px_rgba(7,10,18,0.5)]">
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
                <p className="rounded-2xl border border-[var(--color-border)] px-4 py-16 text-center text-sm text-[var(--color-muted)]">
                  No video found for this song.
                </p>
              )}
            </div>
          </section>

          {/* Right — song list + video */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.66)] p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-text)]">
                  {songs.length} {songs.length === 1 ? "Song" : "Songs"}
                </h2>
                <Youtube className="h-5 w-5 text-red-500" />
              </div>

              <ul className="space-y-1">
                {songs.map((song, index) => {
                  const active = index === selectedIndex;
                  return (
                    <li key={song.spotifyId}>
                      <button
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                          active
                            ? "bg-[var(--color-accent-soft)]"
                            : "hover:bg-[rgba(255,255,255,0.04)]"
                        }`}
                      >
                        <div className="min-w-0">
                          <p
                            className={`flex items-center gap-2 truncate text-sm font-semibold ${
                              active ? "text-[var(--color-accent-strong)]" : "text-[var(--color-text)]"
                            }`}
                          >
                            {active && <AudioLines className="h-3.5 w-3.5 shrink-0" />}
                            <span className="truncate">{song.title}</span>
                          </p>
                          {song.artists.length > 0 && (
                            <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                              {song.artists.join(", ")}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 pt-0.5 text-xs tabular-nums text-[var(--color-muted)]">
                          {formatDuration(song.durationMs)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[var(--color-accent-strong)]">
        {value && value.trim() ? value : "—"}
      </dd>
    </div>
  );
}
