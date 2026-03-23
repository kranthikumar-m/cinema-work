function getOptionalEnvVar(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

export const env = {
  TMDB_API_KEY: getOptionalEnvVar("TMDB_API_KEY"),
  GOOGLE_IMAGES_USER_AGENT: getOptionalEnvVar("GOOGLE_IMAGES_USER_AGENT"),
  DATABASE_URL: getOptionalEnvVar("DATABASE_URL"),
  AUTH_SECRET: getOptionalEnvVar("AUTH_SECRET"),
  ADMIN_BOOTSTRAP_EMAIL: getOptionalEnvVar("ADMIN_BOOTSTRAP_EMAIL"),
  ADMIN_BOOTSTRAP_PASSWORD: getOptionalEnvVar("ADMIN_BOOTSTRAP_PASSWORD"),
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
