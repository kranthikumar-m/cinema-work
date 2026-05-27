export const SESSION_COOKIE_NAME = "tcu_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60;

export const AUTH_PAGE_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;
