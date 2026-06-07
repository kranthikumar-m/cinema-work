"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Disc3, ChevronRight, Eye } from "lucide-react";
import { VideoPlayerModal } from "@/components/movie/VideoPlayerModal";
import type { MovieMusic } from "@/services/movie-music";

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
}

// Dedicated soundtrack section: album card + a numbered track list. Playable
// tracks open inline in the shared VideoPlayerModal (with the other songs as the
// up-next sidebar); the full immersive player lives at /music/[id].
export function MovieSongs({ music, movieId, movieTitle, albumImage }: MovieSongsProps) {
  const { album, songs } = music;
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  if (!songs.length) return null;

  const cover = album?.imageUrl || albumImage || null;
  const isRemoteCover = cover ? /^https?:\/\//.test(cover) : false;

  // Sidebar / up-next list for the modal = every song that has a video.
  const playerItems = songs
    .filter((s) => s.youtubeKey)
    .map((s) => ({ key: s.youtubeKey as string, title: s.title, category: "song" }));
  const playingTitle = songs.find((s) => s.youtubeKey === playingKey)?.title ?? "";

  return (
    <>
      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Album card */}
        <div className="flex gap-4 md:flex-col">
          <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-lg md:w-full">
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
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[var(--color-text)]">
              {album?.name || movieTitle}
            </p>
            {album?.musicDirector && (
              <p className="mt-1 truncate text-sm text-[var(--color-muted-strong)]">
                {album.musicDirector}
              </p>
            )}
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {songs.length} {songs.length === 1 ? "song" : "songs"}
            </p>
            <Link
              href={`/music/${movieId}`}
              className="group mt-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(194,154,98,0.32)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition hover:border-[rgba(194,154,98,0.6)] hover:bg-[var(--color-accent-soft)]"
            >
              <Disc3 className="h-3.5 w-3.5" />
              Music player
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Track list */}
        <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)]">
          {songs.map((song, index) => {
            const views = formatCount(song.youtubeViews);
            const playable = Boolean(song.youtubeKey);
            return (
              <li key={song.spotifyId}>
                <button
                  type="button"
                  onClick={() => playable && setPlayingKey(song.youtubeKey)}
                  disabled={!playable}
                  className={`flex w-full items-center gap-4 px-4 py-3 text-left transition ${
                    playable ? "hover:bg-[rgba(194,154,98,0.06)]" : "cursor-default opacity-60"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-xs font-semibold tabular-nums text-[var(--color-muted)]">
                    {playable ? (
                      <Play className="h-4 w-4 fill-current text-[var(--color-accent)]" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {song.title}
                    </p>
                    {song.artists.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                        {song.artists.join(", ")}
                      </p>
                    )}
                  </div>
                  {views && (
                    <span className="hidden shrink-0 items-center gap-1 text-xs text-[var(--color-muted)] sm:inline-flex">
                      <Eye className="h-3.5 w-3.5" />
                      {views}
                    </span>
                  )}
                  <span className="shrink-0 text-xs tabular-nums text-[var(--color-muted)]">
                    {formatDuration(song.durationMs)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <VideoPlayerModal
        videoKey={playingKey}
        title={playingTitle}
        videos={playerItems}
        onClose={() => setPlayingKey(null)}
      />
    </>
  );
}
