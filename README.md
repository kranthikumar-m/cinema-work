# Cinemax - Movie Discovery Portal

A modern, dark-themed movie news and discovery website built with Next.js 14, TypeScript, and Tailwind CSS. Powered by the TMDB API.

## Features

- Full-screen hero carousel with trending movies
- Movie listing pages: Trending, Popular, Upcoming, Top Rated, Now Playing
- Detailed movie pages with trailers, cast, photos, reviews, and watch providers
- Instant search with debounced input
- Editorial content sections (News, Reviews, Interviews, Features)
- Left sidebar + top navigation layout
- Right sidebar widgets for quick discovery
- Fully responsive (desktop, tablet, mobile)
- Dark cinematic theme with cyan accent

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Primitives**: Radix UI
- **API**: TMDB (The Movie Database)

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
docker build -t cinemax --build-arg TMDB_API_KEY=your_key .

# Run the container
docker run -p 3000:3000 -e TMDB_API_KEY=your_key cinemax
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
git clone <repo-url> cinemax
cd cinemax
npm ci
cp .env.example .env.local
# Edit .env.local with your TMDB_API_KEY
npm run build
```

#### 3. Start with PM2

```bash
pm2 start npm --name "cinemax" -- start
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
sudo ln -s /etc/nginx/sites-available/cinemax /etc/nginx/sites-enabled/
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
