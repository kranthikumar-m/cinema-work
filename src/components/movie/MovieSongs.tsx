"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AudioLines,
  Check,
  ChevronRight,
  Disc3,
  Eye,
  Play,
  Share2,
  ThumbsUp,
  X,
} from "lucide-react";
import type { MovieMusic, MovieSong } from "@/services/movie-music";

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

interface MovieSongsProps {
  music: MovieMusic;
  movieId: number;
  movieTitle: string;
  albumImage: string | null;
  cast?: string[];
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="eyebrow-label text-[var(--color-muted)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--color-accent-strong)]">
        {value && value.trim() ? value : "—"}
      </dd>
    </div>
  );
}

/**
 * Soundtrack panel in three columns: album art and credits, the selected
 * song's lyrics and stats, and the track list. Playing a track opens a small
 * player pinned to the corner so the lyrics stay readable while it plays.
 */
export function MovieSongs({ music, movieId, movieTitle, albumImage, cast = [] }: MovieSongsProps) {
  const { album, songs } = music;
  const firstWithLyrics = Math.max(0, songs.findIndex((song) => song.lyrics));
  const [selectedIndex, setSelectedIndex] = useState(firstWithLyrics);
  const [playing, setPlaying] = useState<MovieSong | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!songs.length) return null;

  const selected = songs[Math.min(selectedIndex, songs.length - 1)];
  const cover = album?.imageUrl || albumImage || null;
  const isRemoteCover = cover ? /^https?:\/\//.test(cover) : false;
  const views = formatCount(selected.youtubeViews);
  const likes = formatCount(selected.youtubeLikes);

  async function share() {
    const url = selected.youtubeKey
      ? `https://www.youtube.com/watch?v=${selected.youtubeKey}`
      : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${selected.title} — ${movieTitle}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* dismissed */
    }
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Album + credits */}
        <aside className="flex gap-4 lg:flex-col">
          <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-lg lg:w-full">
            {cover ? (
              <Image
                src={cover}
                alt={album?.name || movieTitle}
                fill
                sizes="220px"
                className="object-cover"
                unoptimized={isRemoteCover}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[var(--color-bg-elevated)]">
                <Disc3 className="h-10 w-10 text-[var(--color-muted)]" />
              </div>
            )}
          </div>
          <dl className="min-w-0 space-y-3">
            <MetaRow label="Album" value={album?.name || movieTitle} />
            <MetaRow label="Singers" value={selected.artists.join(", ")} />
            <MetaRow label="Music" value={album?.musicDirector} />
            <MetaRow label="Music label" value={album?.label} />
            {cast.length > 0 && <MetaRow label="Cast" value={cast.join(", ")} />}
            <Link
              href={`/music/${movieId}`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-[rgba(194,154,98,0.32)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition hover:border-[rgba(194,154,98,0.6)] hover:bg-[var(--color-accent-soft)]"
            >
              <Disc3 className="h-3.5 w-3.5" />
              Full player
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </dl>
        </aside>

        {/* Selected song: title, stats, lyrics */}
        <section className="min-w-0">
          <p className="eyebrow-label text-[var(--color-accent)]">Song</p>
          <h3 className="mt-1 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-text)] md:text-2xl">
            {selected.title}
            <span className="font-normal text-[var(--color-muted)]"> — {movieTitle}</span>
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-strong)]">
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
              onClick={share}
              className="inline-flex items-center gap-1.5 transition hover:text-[var(--color-text)]"
            >
              {copied ? <Check className="h-4 w-4 text-[var(--color-accent)]" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Copied" : "Share"}
            </button>
            {selected.youtubeKey && (
              <button
                type="button"
                onClick={() => setPlaying(selected)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-accent-contrast)] transition hover:brightness-105"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Play
              </button>
            )}
          </div>

          <div className="relative mt-5">
            {selected.lyrics ? (
              <>
                <pre
                  className={`whitespace-pre-wrap font-[family-name:var(--font-body)] text-[15px] leading-7 text-[var(--color-text)]/90 ${
                    expanded ? "" : "max-h-[26rem] overflow-hidden"
                  }`}
                >
                  {selected.lyrics}
                </pre>
                {!expanded && selected.lyrics.split("\n").length > 16 && (
                  <div className="absolute inset-x-0 bottom-0 flex h-24 items-end justify-center bg-gradient-to-t from-[var(--color-bg)] to-transparent">
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.5)]"
                    >
                      Show full lyrics
                    </button>
                  </div>
                )}
                {selected.geniusUrl && (
                  <p className="mt-3 text-[11px] text-[var(--color-muted)]">
                    Lyrics via{" "}
                    <a href={selected.geniusUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-text)]">
                      Genius
                    </a>
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-2xl border border-[var(--color-border)] px-5 py-10 text-center text-sm text-[var(--color-muted)]">
                Lyrics are not available for this song yet.
              </p>
            )}
          </div>
        </section>

        {/* Track list */}
        <aside className="self-start rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)] p-3">
          <div className="mb-2 flex items-center justify-between border-b border-[var(--color-border)] px-2 pb-2.5">
            <h4 className="font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text)]">
              {songs.length} {songs.length === 1 ? "Song" : "Songs"}
            </h4>
            <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">YouTube</span>
          </div>
          <ul className="space-y-0.5">
            {songs.map((song, index) => {
              const active = index === selectedIndex;
              const playable = Boolean(song.youtubeKey);
              const songViews = formatCount(song.youtubeViews);
              return (
                <li key={song.spotifyId} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIndex(index);
                      setExpanded(false);
                    }}
                    className={`flex min-w-0 flex-1 items-start justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                      active ? "bg-[var(--color-accent-soft)]" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`flex items-center gap-1.5 truncate text-sm font-semibold ${
                          active ? "text-[var(--color-accent-strong)]" : "text-[var(--color-text)]"
                        }`}
                      >
                        {active && <AudioLines className="h-3.5 w-3.5 shrink-0" />}
                        <span className="truncate">{song.title}</span>
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]">
                        {song.artists.join(", ")}
                        {songViews ? ` · ${songViews} views` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-[var(--color-muted)]">
                      {formatDuration(song.durationMs)}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!playable}
                    onClick={() => {
                      setSelectedIndex(index);
                      setPlaying(song);
                    }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                      playable
                        ? "text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-contrast)]"
                        : "cursor-default text-[var(--color-muted)] opacity-40"
                    }`}
                    aria-label={playable ? `Play ${song.title}` : `${song.title} has no video`}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      {/* Pinned mini player */}
      {playing?.youtubeKey && (
        <div className="fixed bottom-4 right-4 z-[90] w-[min(92vw,380px)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-black shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <p className="truncate text-xs font-semibold text-white">{playing.title}</p>
            <button
              type="button"
              onClick={() => setPlaying(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close player"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <iframe
            key={playing.youtubeKey}
            src={`https://www.youtube.com/embed/${playing.youtubeKey}?autoplay=1&rel=0&modestbranding=1`}
            title={playing.title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </>
  );
}
