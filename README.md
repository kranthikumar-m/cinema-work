# Telugu Cinema Updates

Telugu Cinema Updates is a Telugu-first movie discovery platform built with Next.js. It prioritizes Telugu movie releases and editorial coverage, validates current-year releases against Wikipedia, supports fallback artwork when TMDB is incomplete, and now includes a real database-backed authentication and authorization system for users and admins.

## Features

- Telugu-first homepage, discovery feeds, and movie detail pages
- TMDB-driven movie data with Wikipedia validation for current-year Telugu releases
- Fallback poster/backdrop lookup only when TMDB is missing assets
- Real user authentication:
  - register
  - login
  - logout
  - forgot password
  - reset password
  - persistent cookie sessions
- Role-based authorization:
  - `user`
  - `admin`
- Protected account page for authenticated users
- Protected admin console for backdrop overrides and user management
- Admin tools for:
  - viewing users
  - searching/filtering users
  - creating users
  - changing role
  - enabling/disabling users
  - deleting users

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Lucide React
- Radix UI
- SQLite for local development and Supabase-backed auth/admin persistence in deployment
- TMDB API
- Wikipedia scraping for Telugu release validation

## Prerequisites

- Node.js 18+ (20 recommended)
- npm 9+
- TMDB API key

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file:

```bash
cp .env.example .env.local
```

Set the core values:

```env
TMDB_API_KEY=your_tmdb_key
DATABASE_URL=file:./data/cinema.sqlite
AUTH_SECRET=replace_with_a_long_random_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For Supabase-backed deployments, set:

```env
DATABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_server_side_service_role_key
AUTH_SECRET=replace_with_a_long_random_secret
```

This repo also defaults production auth/admin storage to `https://jnevaakkhhndokvnickz.supabase.co` when no database URL env is set, so the only required deployment secret for Supabase storage is usually `SUPABASE_SERVICE_ROLE_KEY`.

Optional bootstrap admin setup:

```env
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=change-me-now
```

When the database is empty, the first server startup will create this admin automatically.

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Authentication Setup

The app uses a custom production-oriented auth flow backed by SQLite in local development and by Supabase when `DATABASE_URL` is set to your Supabase project URL.

### What is stored

- `users`
- `sessions`
- `password_reset_tokens`
- `movie_backdrop_overrides`

### Security model

- Passwords are hashed with `scrypt`
- Session cookies are `httpOnly`
- Reset tokens are random, hashed, single-use, and time-limited
- Disabled accounts are blocked server-side
- Login, registration, and forgot-password endpoints include basic server-side rate limiting
- Admin routes and admin APIs are enforced on the server, not just hidden in the UI

### Roles

- `user`: normal authenticated account
- `admin`: admin console access and user management

The database still tolerates older stored roles such as `editor` and `viewer` for backward compatibility, but the public auth system exposes the supported roles as `user` and `admin`.

## Password Reset Email Integration

The full reset flow is implemented, including token generation, expiry, and token consumption.

Email delivery is currently stubbed in:

- `src/services/auth-mail.ts`

Replace that implementation with your real provider, for example:

- Resend
- Postmark
- SES
- SendGrid

In development, the forgot-password API also returns the reset URL in the JSON response so the flow can be tested without email infrastructure.

## Admin Access

### Initial admin creation

Use one of these approaches:

1. Set `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` before first run.
2. Start the app with an empty database so the bootstrap admin is created automatically.

### Admin routes

- `/admin`
- `/admin/users`

Admin-only APIs are under:

- `/api/admin/*`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TMDB_API_KEY` | Yes | TMDB API key |
| `DATABASE_URL` | Optional in this repo | Local SQLite `file:` URL or your Supabase project URL. Local development falls back to `file:./data/cinema.sqlite`; production falls back to this repo's configured Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for Supabase | Server-side key used for auth/admin storage when `DATABASE_URL` points to Supabase |
| `AUTH_SECRET` | Yes in production | Secret used to sign/hash session and reset tokens. Local development has a fallback secret only outside production. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public base URL used in reset links |
| `TMDB_BASE_URL` | No | Override TMDB API base URL |
| `GOOGLE_IMAGES_USER_AGENT` | No | User agent for fallback image retrieval |
| `ADMIN_BOOTSTRAP_EMAIL` | Optional | Seed the first admin when DB is empty |
| `ADMIN_BOOTSTRAP_PASSWORD` | Optional | Seed password for the first admin |

## Route Protection

Protection is enforced in layers:

- Middleware:
  - redirects unauthenticated access away from `/account` and `/admin/*`
- Server-side page guards:
  - `requireAuthenticatedUser`
  - `requireAdminUser`
  - `requireLoggedOutUser`
- API guards:
  - authenticated API guard
  - admin API guard

## Telugu Release Pipeline

The Telugu movie pipeline still works like this:

1. TMDB is queried with Telugu-first signals such as original language, region, and release-date filters.
2. Current-year Telugu releases are scraped from relevant Wikipedia release pages.
3. Titles are normalized and fuzzy-matched.
4. A movie is treated as a validated Telugu release only when TMDB and Wikipedia agree on the release date.
5. Missing posters/backdrops fall back to Google Images only when TMDB does not provide a usable asset.

## Deployment Notes

- Set `DATABASE_URL`, `AUTH_SECRET`, and `TMDB_API_KEY` explicitly in production.
- For Supabase deployments, set `DATABASE_URL` to `https://your-project-ref.supabase.co`, set `SUPABASE_SERVICE_ROLE_KEY`, and run `supabase/schema.sql` once in the Supabase SQL editor before deploying.
- If you stay on SQLite in production, use a persistent filesystem path or mounted volume instead of relying on the default local dev path.
- Replace the password-reset email stub before enabling user-facing password recovery in production.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |

## Project Structure

```text
src/
  app/
    account/                  # Authenticated account page
    admin/                    # Protected admin console
    api/auth/                 # Register/login/logout/reset APIs
    api/admin/                # Admin-only APIs
    movie/[id]/               # Movie detail page
    movies/                   # Telugu movie listing pages
  components/
    admin/                    # Admin UI
    auth/                     # Auth forms, provider, sign-out
    home/                     # Homepage hero and feeds
    layout/                   # Sidebar, top nav, footer, search overlay
  lib/
    auth.ts                   # Auth/session/user management
    database.ts               # SQLite/Supabase persistence provider
  services/
    tmdb.ts                   # TMDB integration
    wikipedia.ts              # Wikipedia validation
    movie-backdrops.ts        # Admin-aware backdrop resolution
```

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
