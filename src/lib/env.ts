const optionalEnvFallbacks = {
  DATABASE_URL: "file:./data/cinema.sqlite",
  AUTH_SECRET: "local-dev-auth-secret-change-in-production",
} as const;
const productionSupabaseProjectUrl = "https://jnevaakkhhndokvnickz.supabase.co";

function getOptionalEnvVar(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

function getConfiguredDatabaseUrl(): string | undefined {
  const isProduction = (process.env.NODE_ENV || "development") === "production";
  const configuredUrl =
    process.env.DATABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (isProduction) {
    return productionSupabaseProjectUrl;
  }

  return optionalEnvFallbacks.DATABASE_URL;
}

function getConfiguredEnvVar(key: string): string | undefined {
  const allowFallbacks = (process.env.NODE_ENV || "development") !== "production";
  const fallback =
    allowFallbacks && key in optionalEnvFallbacks
      ? optionalEnvFallbacks[key as keyof typeof optionalEnvFallbacks]
      : undefined;

  return getOptionalEnvVar(key, fallback);
}

export const env = {
  TMDB_API_KEY: getOptionalEnvVar("TMDB_API_KEY"),
  GOOGLE_IMAGES_USER_AGENT: getOptionalEnvVar("GOOGLE_IMAGES_USER_AGENT"),
  DATABASE_URL: getConfiguredDatabaseUrl(),
  SUPABASE_SERVICE_ROLE_KEY: getOptionalEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  AUTH_SECRET: getConfiguredEnvVar("AUTH_SECRET"),
  ADMIN_BOOTSTRAP_EMAIL: getOptionalEnvVar("ADMIN_BOOTSTRAP_EMAIL"),
  ADMIN_BOOTSTRAP_PASSWORD: getOptionalEnvVar("ADMIN_BOOTSTRAP_PASSWORD"),
  TMDB_BASE_URL:
    getOptionalEnvVar("TMDB_BASE_URL", "https://api.themoviedb.org/3") ||
    "https://api.themoviedb.org/3",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

export function requireEnvVar(key: string): string {
  const value = getConfiguredEnvVar(key);

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Check your deployment environment or .env.local file.`
    );
  }

  return value;
}
