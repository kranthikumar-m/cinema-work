function getOptionalEnvVar(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

export const env = {
  TMDB_API_KEY: getOptionalEnvVar("TMDB_API_KEY"),
  TMDB_BASE_URL:
    getOptionalEnvVar("TMDB_BASE_URL", "https://api.themoviedb.org/3") ||
    "https://api.themoviedb.org/3",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

export function requireEnvVar(key: string): string {
  const value = getOptionalEnvVar(key);

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Check your deployment environment or .env.local file.`
    );
  }

  return value;
}
