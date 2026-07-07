# APOD Console

APOD Console is a mission-control-style dashboard for NASA's Astronomy Picture of the Day API. It presents each daily APOD as a decoded deep-space transmission, with a telemetry console, viewfinder media frame, UTC mission clock, local cache, recent transmission history, random archive jumps, and explicit signal-loss states.

Live demo: https://your-github-username.github.io/apod-console/

## Features

- Daily and historical APOD retrieval from `https://api.nasa.gov/planetary/apod`
- Date picker for time travel back to the APOD archive start date: `1995-06-16`
- Random Signal control for jumping to a random valid APOD date
- Image and video handling, including embedded video media from NASA responses
- Local `localStorage` cache keyed by APOD date, with recent transmission thumbnails
- Mission-control interface with a boot sequence, viewfinder frame, telemetry sidebar, scanline overlay, and reduced-motion support
- GitHub Pages deployment through GitHub Actions on every push to `main`

## Setup

Clone the repository:

```bash
git clone https://github.com/your-github-username/apod-console.git
cd apod-console
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Add a NASA API key from https://api.nasa.gov/:

```bash
VITE_NASA_API_KEY=your_real_key_here
```

Start the Vite dev server:

```bash
npm run dev
```

The app reads `import.meta.env.VITE_NASA_API_KEY` and falls back to `DEMO_KEY` when no key is configured, so the console remains runnable before a real key is added.

## Deployment

This project is configured for GitHub Pages under the repository path `/apod-console/`. The Vite config uses that base path so built assets resolve correctly from:

```text
https://your-github-username.github.io/apod-console/
```

Deployment is handled by a GitHub Actions workflow at `.github/workflows/deploy.yml`. On every push to `main`, the workflow installs dependencies, builds the Vite app, and publishes the generated `dist` directory to GitHub Pages. No manual `gh-pages` branch push is required.

## API Key Note

The NASA APOD key is exposed to the browser because this is a static frontend for a free public API. That tradeoff is acceptable for APOD, especially with `DEMO_KEY` fallback during development. Any sensitive API key, paid quota, private data access, or privileged operation would need to move behind a backend proxy instead of being shipped in frontend JavaScript.
