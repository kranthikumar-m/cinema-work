/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    // Serve images directly from their source (TMDB CDN / static files) and
    // skip Next/Vercel image optimization. Vercel's optimizer returns
    // 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED once its quota is exhausted,
    // which broke every optimized image (hero, posters, cast). TMDB already
    // provides correctly sized variants (w200..w1280), so optimization adds
    // little here and isn't worth the hard dependency on the paid quota.
    unoptimized: true,
    // Harmless with unoptimized; lets first-party placeholder SVGs render.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
