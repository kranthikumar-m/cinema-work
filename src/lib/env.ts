function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Check your .env.local file.`
    );
  }
  return value;
}

export const env = {
  TMDB_API_KEY: getEnvVar("TMDB_API_KEY"),
  TMDB_BASE_URL: getEnvVar("TMDB_BASE_URL", "https://api.themoviedb.org/3"),
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;
