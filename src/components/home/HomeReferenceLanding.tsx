import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Globe,
  Image as ImageIcon,
  type LucideIcon,
  Music2,
  Play,
  Star,
  User,
} from "lucide-react";
import { HomeReferenceSearch } from "@/components/home/HomeReferenceSearch";
import { SiteLogo } from "@/components/layout/SiteLogo";
import {
  formatDate,
  getBackdropUrl,
  getImageUrl,
  getMovieBackdropUrl,
} from "@/lib/utils";
import type { HomepageHeroItem } from "@/types/homepage";
import type { Credits, Movie, MovieDetails, MovieImage } from "@/types/tmdb";

interface HomeReferenceLandingProps {
  heroItem: HomepageHeroItem;
  featuredMovie: Movie | null;
  featuredDetails: MovieDetails | null;
  featuredCredits: Credits | null;
  featuredImages: { backdrops: MovieImage[]; posters: MovieImage[] } | null;
  upcoming: Movie[];
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

function getGalleryImages(
  featuredImages: { backdrops: MovieImage[]; posters: MovieImage[] } | null,
  fallbackImage: string
) {
  const backdrops = (featuredImages?.backdrops ?? [])
    .slice()
    .sort((a, b) => b.width - a.width)
    .map((image) => getBackdropUrl(image.file_path, "original"));

  const unique = Array.from(new Set(backdrops));

  while (unique.length < 3) {
    unique.push(fallbackImage);
  }

  return unique.slice(0, 3);
}

function FeatureButton({
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
  const isExternal = isExternalLink(href);

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      className={
        primary
          ? "inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#ebbf84] to-[#c29a62] px-8 py-4 font-semibold text-[#452b00] shadow-[0_16px_40px_rgba(235,191,132,0.18)] transition hover:scale-[1.02]"
          : "inline-flex items-center gap-3 rounded-full border border-[#4f453a]/60 bg-[#0f1322]/30 px-8 py-4 font-semibold text-[#ebbf84] transition hover:border-[#ebbf84]/45 hover:bg-[#171b2b]"
      }
    >
      <Icon className={primary ? "h-5 w-5 fill-current" : "h-5 w-5"} />
      <span>{label}</span>
    </Link>
  );
}

function HomeMetaColumn({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-[100px] flex-col">
      <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ebbf84]/60">
        {label}
      </span>
      <span className="text-base font-medium text-[#dee1f8]">{value}</span>
    </div>
  );
}

function HomeReferenceFooter() {
  return (
    <footer className="border-t border-[#4f453a]/20 bg-[#090d1d] px-5 py-12 md:px-8 xl:px-12">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="w-[148px]">
            <SiteLogo variant="footer" />
          </div>
          <p className="text-sm text-[#d2c4b5]">
            &copy; {new Date().getFullYear()} Telugu Cinema Updates. All rights
            reserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-8 text-xs uppercase tracking-[0.18em] text-[#d2c4b5]">
          <span>Privacy</span>
          <span>Archives</span>
          <span>Press Kit</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#25293a] text-[#d2c4b5]">
            <Globe className="h-4 w-4" />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#25293a] text-[#d2c4b5]">
            <Music2 className="h-4 w-4" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export function HomeReferenceLanding({
  heroItem,
  featuredMovie,
  featuredDetails,
  featuredCredits,
  featuredImages,
  upcoming,
}: HomeReferenceLandingProps) {
  const heroImage =
    heroItem.imageUrl ||
    (featuredMovie ? getMovieBackdropUrl(featuredMovie, "original") : null) ||
    getBackdropUrl(heroItem.backdropPath ?? null, "original");
  const galleryImages = getGalleryImages(featuredImages, heroImage);
  const castMembers = featuredCredits?.cast.slice(0, 3) ?? [];
  const upcomingFeature =
    upcoming.find((movie) => movie.id !== featuredMovie?.id) ?? null;
  const teaserAvatars = castMembers
    .filter((member) => member.profile_path)
    .slice(0, 3);
  const { leading, accent } = splitTitle(heroItem.title);
  const rating = featuredMovie?.vote_average ?? 4.8;
  const starCount = Math.max(1, Math.min(5, Math.round(rating / 2)));
  const genres =
    featuredDetails?.genres.slice(0, 2).map((genre) => genre.name).join(", ") ||
    "Drama, Political";
  const overview =
    featuredMovie?.overview ||
    featuredDetails?.tagline ||
    "A high-stakes Telugu feature navigating power, family, and spectacle on a massive canvas.";

  return (
    <div className="min-h-screen bg-[#0f1322] text-[#dee1f8]">
      <header className="sticky top-0 z-20 border-b border-[#4f453a]/20 bg-[#0f1322]/82 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-5 md:px-8 xl:px-12">
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#overview"
              className="font-[family-name:var(--font-manrope)] text-sm font-bold tracking-[0.04em] text-[#ebbf84]"
            >
              OVERVIEW
            </Link>
            <Link
              href="/reviews"
              className="font-[family-name:var(--font-manrope)] text-sm tracking-[0.04em] text-[#dee1f8]/70 transition-colors hover:text-[#ebbf84]"
            >
              CRITICS
            </Link>
            <Link
              href="/movies/trending"
              className="font-[family-name:var(--font-manrope)] text-sm tracking-[0.04em] text-[#dee1f8]/70 transition-colors hover:text-[#ebbf84]"
            >
              BOX OFFICE
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-6">
            <HomeReferenceSearch />
            <button
              type="button"
              className="text-[#dee1f8]/70 transition-colors hover:text-[#ebbf84]"
              aria-label="Profile"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section
          id="overview"
          className="relative flex min-h-[921px] flex-col justify-end overflow-hidden px-5 pb-24 pt-10 md:px-8 xl:px-12"
        >
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={heroItem.title}
              fill
              priority
              sizes="100vw"
              quality={95}
              className="object-cover"
              unoptimized={shouldUseUnoptimizedImage(heroImage)}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,19,34,0.96)_10%,rgba(15,19,34,0.78)_36%,rgba(15,19,34,0.18)_68%,rgba(15,19,34,0.06)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,19,34,0.12)_0%,rgba(15,19,34,0.08)_36%,rgba(15,19,34,0.9)_100%)]" />
          </div>

          <div className="relative z-10 max-w-4xl space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#ebbf84]/30 bg-[#ebbf84]/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#ebbf84]">
                Feature Selection
              </span>
              <div className="flex items-center gap-1 text-[#ebbf84]">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={
                      index < starCount
                        ? "h-4 w-4 fill-current"
                        : "h-4 w-4 text-[#ebbf84]/30"
                    }
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-[#dee1f8]">
                  {rating.toFixed(1)} / 10
                </span>
              </div>
            </div>

            <h1 className="font-[family-name:var(--font-manrope)] text-[clamp(3rem,8vw,6rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.06em] text-[#dee1f8]">
              {leading ? (
                <>
                  {leading} <span className="italic text-[#ebbf84]">{accent}</span>
                </>
              ) : (
                <span className="italic text-[#ebbf84]">{accent}</span>
              )}
            </h1>

            <div className="flex flex-wrap items-center gap-8 text-[#d2c4b5]">
              <HomeMetaColumn
                label="Release Date"
                value={featuredMovie?.release_date ? formatDate(featuredMovie.release_date) : heroItem.releaseLabel}
              />
              <div className="hidden h-8 w-px bg-[#4f453a]/30 md:block" />
              <HomeMetaColumn label="Genres" value={genres} />
              <div className="hidden h-8 w-px bg-[#4f453a]/30 md:block" />
              <HomeMetaColumn
                label="Director"
                value={heroItem.director || "Details coming soon"}
              />
            </div>

            <p className="max-w-2xl text-lg leading-8 text-[#d2c4b5]">
              {overview}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <FeatureButton href={heroItem.trailerHref} label="Trailers" icon={Play} primary />
              <FeatureButton href="/videos" label="Audio" icon={Music2} />
              <FeatureButton href="/photos" label="Images" icon={ImageIcon} />
            </div>
          </div>
        </section>

        <section className="px-5 py-24 md:px-8 xl:px-12">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 xl:grid-cols-12">
            <div className="rounded-sm bg-[#1b1f2f] xl:col-span-8">
              <div className="flex items-end justify-between gap-6 p-8">
                <div>
                  <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[#dee1f8]">
                    Leading Roles
                  </h2>
                  <p className="mt-1 text-sm text-[#d2c4b5]">
                    The forces behind the characters
                  </p>
                </div>
                <Link
                  href={featuredMovie ? `/movie/${featuredMovie.id}` : "/movies/trending"}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ebbf84]"
                >
                  View Full Cast
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 px-8 pb-8 md:grid-cols-3">
                {castMembers.length ? (
                  castMembers.map((member) => {
                    const profileImage = getImageUrl(member.profile_path, "w500");

                    return (
                      <div
                        key={member.id}
                        className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-[#171b2b]"
                      >
                        <Image
                          src={profileImage}
                          alt={member.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover grayscale transition duration-500 group-hover:grayscale-0"
                          unoptimized={shouldUseUnoptimizedImage(profileImage)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <p className="font-[family-name:var(--font-manrope)] font-bold text-[#ebbf84]">
                            {member.name}
                          </p>
                          <p className="text-xs uppercase tracking-[0.12em] text-[#dee1f8]/60">
                            {member.character || "Featured Role"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full rounded-sm border border-[#4f453a]/20 bg-[#171b2b] p-8 text-center text-[#d2c4b5]">
                    Cast information is being updated.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-sm border border-[#ebbf84]/10 bg-[rgba(53,56,74,0.4)] p-8 backdrop-blur-[20px] xl:col-span-4">
              <div className="flex min-h-[324px] flex-col justify-between">
                <div>
                  <span className="inline-block border-b border-[#ebbf84]/30 pb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#ebbf84]">
                    Upcoming Telugu Premiere
                  </span>
                  <h3 className="mt-6 font-[family-name:var(--font-manrope)] text-3xl font-extrabold leading-tight text-[#dee1f8]">
                    {upcomingFeature?.title || "Hyderabad Global Event"}
                  </h3>
                  <p className="mt-4 leading-7 text-[#d2c4b5]">
                    {upcomingFeature
                      ? `Follow the rollout for ${upcomingFeature.title}, including trailer drops, posters, and release updates for the Telugu audience.`
                      : "Join the world for the massive unveiling at the iconic Gachibowli Stadium."}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center">
                    {teaserAvatars.map((member, index) => {
                      const avatarImage = getImageUrl(member.profile_path, "w200");

                      return (
                        <div
                          key={member.id}
                          className="-mr-3 inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#171b2b]"
                          style={{ zIndex: teaserAvatars.length - index }}
                        >
                          <Image
                            src={avatarImage}
                            alt={member.name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                            unoptimized={shouldUseUnoptimizedImage(avatarImage)}
                          />
                        </div>
                      );
                    })}
                    <div className="-mr-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#c29a62] text-[10px] font-bold text-[#4d3203] ring-2 ring-[#171b2b]">
                      +{Math.max(12, upcoming.length)}
                    </div>
                  </div>

                  <Link
                    href={upcomingFeature ? `/movie/${upcomingFeature.id}` : "/movies/upcoming"}
                    className="inline-flex w-full items-center justify-center rounded-sm border border-[#4f453a]/30 bg-[#303445] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#dee1f8]"
                  >
                    Register for Access
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 grid max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-4">
            {galleryImages.map((image, index) => (
              <Link
                key={`${image}-${index}`}
                href={featuredMovie ? `/movie/${featuredMovie.id}` : "/photos"}
                className="h-48 overflow-hidden rounded-sm bg-[#1b1f2f]"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={image}
                    alt={`${heroItem.title} still ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover opacity-60 transition duration-300 hover:opacity-100"
                    unoptimized={shouldUseUnoptimizedImage(image)}
                  />
                </div>
              </Link>
            ))}

            <Link
              href={featuredMovie ? `/movie/${featuredMovie.id}` : "/photos"}
              className="group flex h-48 flex-col items-center justify-center rounded-sm border border-[#4f453a]/20 bg-[#1b1f2f] transition-colors hover:bg-[#25293a]"
            >
              <ImageIcon className="h-8 w-8 text-[#ebbf84] transition-transform group-hover:scale-110" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[#ebbf84]/60">
                View More
              </p>
            </Link>
          </div>
        </section>
      </main>

      <HomeReferenceFooter />
    </div>
  );
}
