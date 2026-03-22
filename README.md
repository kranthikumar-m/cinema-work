# Telugu Cinema Updates

A modern movie discovery site focused primarily on Telugu cinema. The app now uses TMDB as the primary movie source, validates current-year Telugu releases against Wikipedia before surfacing them, and only attempts external fallback artwork lookup when TMDB does not provide a poster or backdrop.

## Features

- Full-screen homepage hero with Telugu-first featured titles
- Movie listing pages for validated Telugu releases, popular Telugu titles, upcoming Telugu releases, top-rated Telugu movies, and latest confirmed releases
- Detailed movie pages with trailers, cast, photos, reviews, and watch providers
- Instant Telugu-first movie search with debounced input
- Editorial content sections (News, Reviews, Interviews, Features)
- Left sidebar + top navigation layout
- Right sidebar widgets for quick discovery
- Fully responsive (desktop, tablet, mobile)
- Dark cinematic theme with cyan accent
- Wikipedia cross-validation for current-year Telugu releases
- Fallback poster/backdrop lookup through Google Images only when TMDB assets are missing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Primitives**: Radix UI
- **API**: TMDB (primary), Wikipedia (validation), Google Images (fallback artwork lookup)

## Prerequisites

- Node.js 18+ (20 recommended)
- npm 9+
- A TMDB API key ([get one here](https://www.themoviedb.org/settings/api))

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd cinema-work
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your TMDB API key:

```
TMDB_API_KEY=your_actual_tmdb_api_key
```

Optional: if your hosting provider aggressively blocks Google Images requests, you can override the fallback lookup user agent:

```
GOOGLE_IMAGES_USER_AGENT=Mozilla/5.0 (...)
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm run start
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TMDB_API_KEY` | Yes | Your TMDB API key |
| `TMDB_BASE_URL` | No | TMDB API base URL (default: `https://api.themoviedb.org/3`) |
| `NEXT_PUBLIC_SITE_URL` | No | Public URL for SEO metadata |
| `GOOGLE_IMAGES_USER_AGENT` | No | Custom user agent string for Google Images fallback lookup |

## Telugu Release Pipeline

The app treats Telugu releases as a data pipeline instead of a UI label:

1. TMDB is queried with Telugu-first discover filters such as `with_original_language=te`, India region, release-date windows, and sort order by category.
2. Current-year Telugu releases up to today are fetched from Wikipedia release tables.
3. Titles are normalized and fuzzy-matched so minor transliteration differences can still match when the release date is exact.
4. A movie is only treated as a validated release when:
   - it exists in TMDB
   - the release date matches Wikipedia exactly
   - TMDB still shows strong Telugu signals such as original language plus spoken language and/or India production context
5. Movies that fail validation are excluded from the validated release feed.
6. If a validated movie is missing a poster or backdrop in TMDB, the app tries a Google Images lookup for that missing asset only and stores the result as a distinct fallback URL.

## Limitations

- Wikipedia validation is only applied to current-year released Telugu films up to today. Upcoming titles still come from TMDB Telugu discover feeds.
- Google Images fallback lookup is best-effort. Google may return challenge pages or block requests in some environments, in which case the site falls back to placeholders and stays functional.
- The build/runtime still requires a valid `TMDB_API_KEY` anywhere TMDB requests are made.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variable `TMDB_API_KEY` in Vercel project settings
4. Deploy - Vercel handles everything automatically

No special configuration files are needed. The `next.config.mjs` is already configured with `output: "standalone"` and proper image domains.

### Docker

Build and run with Docker:

```bash
# Build the image
docker build -t tcu --build-arg TMDB_API_KEY=your_key .

# Run the container
docker run -p 3000:3000 -e TMDB_API_KEY=your_key tcu
```

Or use Docker Compose:

```bash
# Create .env file with TMDB_API_KEY=your_key
echo "TMDB_API_KEY=your_key" > .env

# Build and start
docker compose up -d
```

The app will be available at `http://localhost:3000`.

### Linux VPS with PM2 + Nginx

#### 1. Setup Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

#### 2. Deploy the app

```bash
cd /var/www
git clone <repo-url> tcu
cd tcu
npm ci
cp .env.example .env.local
# Edit .env.local with your TMDB_API_KEY
npm run build
```

#### 3. Start with PM2

```bash
pm2 start npm --name "tcu" -- start
pm2 save
pm2 startup
```

#### 4. Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tcu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. HTTPS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker container |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/search/       # Search API route
│   ├── movie/[id]/       # Movie detail page
│   ├── movies/           # Movie listing pages
│   ├── news/             # Editorial pages
│   ├── reviews/
│   ├── interviews/
│   ├── features/
│   ├── search/           # Search results page
│   ├── videos/
│   └── photos/
├── components/
│   ├── layout/           # Sidebar, TopNav, Footer, SearchOverlay
│   ├── movie/            # MovieCard, HeroCarousel, CastCarousel, etc.
│   ├── shared/           # RatingRing, SectionHeader, ErrorState, etc.
│   └── ui/               # Button, Skeleton
├── data/                 # Editorial seed content
├── lib/                  # Utilities, env config
├── services/             # TMDB API service layer
└── types/                # TypeScript type definitions
```

## Attribution

This product uses the [TMDB API](https://www.themoviedb.org/) but is not endorsed or certified by TMDB.
