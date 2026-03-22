import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Image as ImageIcon,
  type LucideIcon,
  Music2,
  Play,
  Star,
  User,
} from "lucide-react";
import { HomeFeatureSearchTrigger } from "@/components/home/HomeFeatureSearchTrigger";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieListWidget } from "@/components/movie/SidebarWidgets";
import { SectionHeader } from "@/components/shared/SectionHeader";
import {
  formatDate,
  getBackdropUrl,
  getImageUrl,
  getMovieBackdropUrl,
} from "@/lib/utils";
import type { HomepageHeroItem } from "@/types/homepage";
import type { Credits, Movie, MovieDetails, MovieImage } from "@/types/tmdb";

interface HomeFeatureLandingProps {
  heroItem: HomepageHeroItem;
  featuredMovie: Movie | null;
  featuredDetails: MovieDetails | null;
  featuredCredits: Credits | null;
  featuredImages: { backdrops: MovieImage[]; posters: MovieImage[] } | null;
  latestReleases: Movie[];
  popular: Movie[];
  upcoming: Movie[];
  topRated: Movie[];
}

function isExternalLink(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function shouldUseUnoptimizedImage(src: string) {
  return /^https?:\/\//i.test(src) && !src.includes("image.tmdb.org");
}

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);

  if (words.length < 2) {
    return { leading: "", accent: title };
  }

  return {
    leading: words.slice(0, -1).join(" "),
    accent: words[words.length - 1],
  };
}

function getDisplayOverview(movie: Movie | null, details: MovieDetails | null) {
  if (movie?.overview) return movie.overview;
  if (details?.tagline) return details.tagline;
  return "A landmark Telugu feature presented with curated cast, release, soundtrack, and gallery highlights.";
}

function getGalleryImages(
  featuredImages: { backdrops: MovieImage[]; posters: MovieImage[] } | null,
  heroItem: HomepageHeroItem
) {
  const images = (featuredImages?.backdrops ?? []).map((image) =>
    getBackdropUrl(image.file_path, "original")
  );

  const uniqueImages = Array.from(new Set(images));
  const fallbackHero =
    heroItem.imageUrl || getBackdropUrl(heroItem.backdropPath ?? null, "original");

  while (uniqueImages.length < 3) {
    uniqueImages.push(fallbackHero);
  }

  return uniqueImages.slice(0, 3);
}

function getFeatureBadge(movie: Movie | null) {
  if (movie?.validation?.status === "validated") {
    return "Validated Telugu Feature";
  }

  return "Telugu Feature Selection";
}

function FeatureActionLink({
  href,
  label,
  icon: Icon,
  primary = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}) {
  const external = isExternalLink(href);

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={
        primary
          ? "inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#ebbf84] to-[#c29a62] px-7 py-3.5 text-sm font-semibold tracking-[0.14em] text-[#201406] shadow-[0_18px_38px_rgba(194,154,98,0.22)] transition hover:-translate-y-0.5"
          : "inline-flex items-center gap-3 rounded-full border border-white/16 bg-[#101522]/72 px-7 py-3.5 text-sm font-semibold tracking-[0.14em] text-[#ebbf84] transition hover:border-[#ebbf84]/35 hover:bg-[#141a2a]"
      }
    >
      <Icon className={primary ? "h-4 w-4 fill-current" : "h-4 w-4"} />
      <span>{label}</span>
    </Link>
  );
}

function MetaColumn({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[132px]">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#ebbf84]/58">
        {label}
      </p>
      <p className="text-sm text-white/86 md:text-base">{value}</p>
    </div>
  );
}

export function HomeFeatureLanding({
  heroItem,
  featuredMovie,
  featuredDetails,
  featuredCredits,
  featuredImages,
  latestReleases,
  popular,
  upcoming,
  topRated,
}: HomeFeatureLandingProps) {
  const { leading, accent } = splitTitle(heroItem.title);
  const heroImage =
    heroItem.imageUrl || getBackdropUrl(heroItem.backdropPath ?? null, "original");
  const galleryImages = getGalleryImages(featuredImages, heroItem);
  const castMembers = featuredCredits?.cast.slice(0, 3) ?? [];
  const rating = featuredMovie?.vote_average ?? 0;
  const starCount = Math.max(1, Math.min(5, Math.round(rating / 2)));
  const genres =
    featuredDetails?.genres.slice(0, 2).map((genre) => genre.name).join(", ") ||
    "Telugu Cinema";
  const director = heroItem.director || "Details coming soon";
  const releaseLabel = featuredMovie?.release_date
    ? formatDate(featuredMovie.release_date)
    : heroItem.releaseLabel;
  const overview = getDisplayOverview(featuredMovie, featuredDetails);
  const spotlightMovie =
    upcoming.find((movie) => movie.id !== featuredMovie?.id) ||
    popular.find((movie) => movie.id !== featuredMovie?.id) ||
    latestReleases.find((movie) => movie.id !== featuredMovie?.id) ||
    null;
  const spotlightBackdrop = spotlightMovie
    ? getMovieBackdropUrl(spotlightMovie, "w1280")
    : null;

  return (
    <div className="bg-[#0f1322] text-[#dee1f8]">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#0f1322]/78 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-5 md:px-8 xl:px-12">
          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="#overview"
              className="text-sm font-bold tracking-[0.22em] text-[#ebbf84] transition-opacity hover:opacity-100"
            >
              OVERVIEW
            </Link>
            <Link
              href="#cast"
              className="text-sm tracking-[0.2em] text-white/66 transition-colors hover:text-[#ebbf84]"
            >
              CAST &amp; CREW
            </Link>
            <Link
              href="#gallery"
              className="text-sm tracking-[0.2em] text-white/66 transition-colors hover:text-[#ebbf84]"
            >
              GALLERY
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <HomeFeatureSearchTrigger />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center text-white/66 transition hover:text-[#ebbf84]"
              aria-label="User profile"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <section
        id="overview"
        className="relative flex min-h-[calc(100svh-80px)] flex-col justify-end overflow-hidden px-5 pb-20 pt-12 md:px-8 xl:px-12"
      >
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={heroItem.title}
            fill
            priority
            sizes="100vw"
            quality={95}
            className="object-cover object-center"
            unoptimized={shouldUseUnoptimizedImage(heroImage)}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,19,34,0.98)_0%,rgba(15,19,34,0.9)_18%,rgba(15,19,34,0.42)_52%,rgba(15,19,34,0.16)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,19,34,0.28)_0%,rgba(15,19,34,0.08)_20%,rgba(15,19,34,0.12)_52%,rgba(15,19,34,0.95)_100%)]" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#ebbf84]/30 bg-[#ebbf84]/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.34em] text-[#ebbf84]">
              {getFeatureBadge(featuredMovie)}
            </span>
            <div className="flex items-center gap-1 text-[#ebbf84]">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className={
                    index < starCount
                      ? "h-4 w-4 fill-current"
                      : "h-4 w-4 text-[#ebbf84]/35"
                  }
                />
              ))}
              <span className="ml-2 text-sm font-medium text-white/92">
                {rating ? rating.toFixed(1) : "4.8"} / 10
              </span>
            </div>
          </div>

          <h1 className="max-w-full overflow-hidden whitespace-nowrap pb-[0.08em] text-ellipsis font-black uppercase leading-[0.94] tracking-[-0.08em] text-white text-[clamp(2.4rem,7.6vw,6rem)]">
            {leading ? (
              <>
                {leading} <span className="italic text-[#ebbf84]">{accent}</span>
              </>
            ) : (
              <span className="italic text-[#ebbf84]">{accent}</span>
            )}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-white/76">
            <MetaColumn label="Release Date" value={releaseLabel} />
            <div className="hidden h-9 w-px bg-white/16 md:block" />
            <MetaColumn label="Genres" value={genres} />
            <div className="hidden h-9 w-px bg-white/16 md:block" />
            <MetaColumn label="Director" value={director} />
          </div>

          <p className="max-w-2xl text-base leading-8 text-white/76 md:text-lg">
            {overview}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <FeatureActionLink
              href={heroItem.trailerHref}
              label="TRAILERS"
              icon={Play}
              primary
            />
            <FeatureActionLink href="/videos" label="AUDIO" icon={Music2} />
            <FeatureActionLink href="/photos" label="IMAGES" icon={ImageIcon} />
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 xl:px-12">
        <div className="mx-auto max-w-[1680px] space-y-8">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            <div
              id="cast"
              className="xl:col-span-8 rounded-[22px] border border-white/8 bg-[#1b1f2f] p-6 md:p-8"
            >
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Leading Roles</h2>
                  <p className="mt-1 text-sm text-white/56">
                    The forces behind the characters
                  </p>
                </div>
                <Link
                  href={featuredMovie ? `/movie/${featuredMovie.id}` : "/movies/trending"}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#ebbf84] transition hover:text-[#f5c78c]"
                >
                  View Full Cast
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {castMembers.length ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {castMembers.map((member) => (
                    <div
                      key={member.id}
                      className="group relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#090d1d]"
                    >
                      <Image
                        src={getImageUrl(member.profile_path, "w500")}
                        alt={member.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover grayscale transition duration-500 group-hover:grayscale-0"
                        unoptimized={!member.profile_path}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="font-semibold text-[#ebbf84]">{member.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/62">
                          {member.character || "Featured Role"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[20px] border border-white/8 bg-[#090d1d] px-5 py-10 text-center text-white/62">
                  Cast details are being updated for this feature.
                </div>
              )}
            </div>

            <div className="xl:col-span-4 rounded-[22px] border border-[#ebbf84]/12 bg-white/6 p-6 backdrop-blur-sm md:p-8">
              <div className="relative overflow-hidden rounded-[18px] border border-white/8 bg-[#111522]">
                {spotlightMovie ? (
                  <>
                    <div className="absolute inset-0">
                      <Image
                        src={spotlightBackdrop || "/placeholder-backdrop.svg"}
                        alt={spotlightMovie.title}
                        fill
                        sizes="(max-width: 1280px) 100vw, 30vw"
                        className="object-cover"
                        unoptimized={
                          spotlightBackdrop
                            ? shouldUseUnoptimizedImage(spotlightBackdrop)
                            : false
                        }
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1322] via-[#0f1322]/72 to-[#0f1322]/18" />
                    </div>
                    <div className="relative flex min-h-[390px] flex-col justify-between p-6">
                      <div>
                        <span className="inline-block border-b border-[#ebbf84]/30 pb-2 text-[10px] font-bold uppercase tracking-[0.32em] text-[#ebbf84]">
                          Upcoming Telugu Premiere
                        </span>
                        <h3 className="mt-6 text-3xl font-extrabold leading-tight text-white">
                          {spotlightMovie.title}
                        </h3>
                        <p className="mt-4 leading-7 text-white/72">
                          Releasing on {formatDate(spotlightMovie.release_date)}. Follow the rollout,
                          promos, and soundtrack updates from the Telugu release slate.
                        </p>
                      </div>
                      <Link
                        href={`/movie/${spotlightMovie.id}`}
                        className="inline-flex items-center justify-center rounded-[10px] border border-white/16 bg-[#1b1f2f]/92 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:border-[#ebbf84]/35 hover:text-[#ebbf84]"
                      >
                        Track Release
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="min-h-[390px] p-6 text-white/66">
                    Upcoming Telugu release details will appear here as soon as they are available.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div id="gallery" className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {galleryImages.map((image, index) => (
              <Link
                key={image + index}
                href={featuredMovie ? `/movie/${featuredMovie.id}` : "/photos"}
                className="group h-52 overflow-hidden rounded-[18px] bg-[#1b1f2f]"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={image}
                    alt={`${heroItem.title} still ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover opacity-72 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                    unoptimized={shouldUseUnoptimizedImage(image)}
                  />
                </div>
              </Link>
            ))}

            <Link
              href={featuredMovie ? `/movie/${featuredMovie.id}` : "/photos"}
              className="group flex h-52 flex-col items-center justify-center rounded-[18px] border border-white/10 bg-[#171b2b] text-center transition hover:border-[#ebbf84]/35 hover:bg-[#202537]"
            >
              <ImageIcon className="h-8 w-8 text-[#ebbf84] transition group-hover:scale-110" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-[#ebbf84]/72">
                View More Stills
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 md:px-8 xl:px-12">
        <div className="mx-auto grid max-w-[1680px] gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <div className="rounded-[22px] border border-white/8 bg-[#1b1f2f] p-6 md:p-8">
              <SectionHeader title="Validated Telugu Releases" href="/movies/trending" />
              <MovieGrid
                movies={latestReleases}
                columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
              />
            </div>

            <div className="rounded-[22px] border border-white/8 bg-[#1b1f2f] p-6 md:p-8">
              <SectionHeader title="Popular Telugu Picks" href="/movies/popular" />
              <MovieGrid
                movies={popular}
                columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
              />
            </div>
          </div>

          <div className="space-y-6">
            <MovieListWidget
              title="Upcoming Telugu Releases"
              movies={upcoming}
              href="/movies/upcoming"
            />
            <MovieListWidget
              title="Top Rated Telugu Movies"
              movies={topRated}
              href="/movies/top-rated"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
