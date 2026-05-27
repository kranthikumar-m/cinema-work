/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    // Our only SVGs are first-party static placeholders; allow the optimizer
    // to serve them (it 400s on SVG by default) while sandboxing for safety.
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
