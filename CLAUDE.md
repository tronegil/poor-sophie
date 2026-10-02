# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all deps
npm install && npm install --prefix frontend && npm install --prefix backend

# Run both dev servers (frontend :5173, backend :3001)
npm run dev

# Frontend only
npm run dev --prefix frontend

# Backend only
npm run dev --prefix backend

# Backend tests (offline, fake THREDDS server)
npm test --prefix backend

# Apply DB schema
psql $DATABASE_URL -f backend/db/schema.sql
```

## Architecture

**Monorepo** — `frontend/` and `backend/` are independent Node packages with a root `package.json` that runs them together via `concurrently`.

### Auth flow
1. Browser hits `/api/auth/google` → Passport.js redirects to Google
2. Google returns to `/api/auth/google/callback` → Passport verifies → JWT issued as httpOnly cookie (`token`, 30-day expiry)
3. All protected API routes use `backend/src/middleware/auth.js` which verifies the JWT cookie
4. Frontend `AuthContext` bootstraps by calling `GET /api/auth/me` on mount; loading state gates all protected routes via `ProtectedRoute`

### Frontend routing
- `/` — public landing page (`pages/Landing.jsx`): the seasickness index for anonymous users, calls `POST /api/passage/score` and `/window` (no auth, IP rate-limited in `routes/publicPassage.js`). First visit with no saved route opens a scored example (`EXAMPLE_TRIP`, Tananger → Skudeneshavn). Poor Sophie login is a small link in its footer.
- `/login` — public, redirects to `/dashboard` if already authed
- `/boats/public/:id` — public shareable boat view (no auth required)
- Everything else — wrapped in `ProtectedRoute` → `NavLayout` (Navbar + `<Outlet>`)

### Key conventions
- API client lives in `frontend/src/api/client.js` (axios, `withCredentials: true`, baseURL `/api`)
- Vite proxies `/api/*` → `localhost:3001` in dev — no CORS issues locally
- i18n translations are in `frontend/src/i18n/en.js` and `no.js`; language persisted in `localStorage` and synced to `users.language` in DB via `PUT /api/users/language`
- Boat photos are URL-based in Phase 1 (no file upload)
- Passage planner UI lives in `components/passage/` (`PassagePlanner` owns route/time/speed state and the departure window, `PassageMap` handles drawing — draggable waypoints, midpoint insert handles, on-map hints — `DepartureStrip` shows the 48 h best-departure bars, `ShareTrip` + `shareLink.js` build and parse the share link — `/?r=lat,lon;…&t=ISO&s=kn&b=presetId` or `b=custom&loa=&disp=&hull=&keel=&n=` — which `Landing` reads once on load and auto-scores, `PassageResults` renders the score and the crew card (`crew.js`: crew multipliers on ISO 2631 MSI and advice tiers), `PlaceSearch` queries `GET /api/places` (`routes/places.js`, cached proxy to Geonorge stedsnavn); editing keeps the last result visible but marked stale); both the boat page and the landing page compose these. Boat presets for the public picker are in `components/passage/boatPresets.js`
- Default language is Norwegian for `nb/nn/no` browsers, else English (`i18n/index.js`)
- Design system lives in `design/` (`tokens.json` = source of truth, `design/README.md` = rules) and is mirrored in `frontend/src/theme.css` (per-theme CSS variables: Dag default, Natt via OS or `data-theme="dark"`, choice in `src/theme.js`) exposed through `frontend/tailwind.config.js` — never hard-code hex or `bg-white`, or Natt breaks. Use the named tokens (`bg-paper`, `bg-surface`, `border-line`, `text-ink`/`text-ink-muted`, `bg-deep text-deep-on` for primary buttons, `text-magenta` for links/accent, `band-*` only for the seasickness score via `bandColor`/`bandInk` in `components/passage/bands.js`), `.label-mono` for field labels, `.data` for measurements, Lucide icons — no emoji. Brand pieces: `components/brand/` (`Wordmark`, `ChartTile`, `Isobaths`)
- PWA: `public/manifest.webmanifest`, `public/icons/`, `public/sw.js` (registered in `main.jsx`, production only). The worker never caches `/api` or map tiles; bump `VERSION` in `sw.js` when its caching rules change. The planner keeps the last result per page in `localStorage` (`<storageKey>:last`) and shows it marked as old on return or offline
- Public vs private boats: `GET /api/boats/:id` checks `is_public`; private boats require a valid JWT cookie belonging to the owner

### Database
Single schema file: `backend/db/schema.sql` (idempotent — re-run it after pulling). Core tables `users` and `boats`, plus maintenance, wiki, chat and `trips` (saved passages per boat, `routes/trips.js`). UUIDs via `pgcrypto`. No ORM — raw `pg` pool queries.

### Vercel deployment
- Root `vercel.json` uses Vercel **services**: `frontend` (Vite, SPA fallback to `index.html`) and `backend` (Express, `server.js`, 60 s maxDuration). Top-level rewrites send `/api/*` to the backend and everything else to the frontend.
- The backend receives the original path *with* the `/api` prefix; `server.js` strips it before the routers (same middleware also makes the Google OAuth callback work locally on port 3001).
- The earlier `experimentalServices` config stopped routing `/api` once Vercel's CLI moved past v51 — don't go back to it.
- For production DB, use Neon with pgBouncer pooler endpoint to avoid connection exhaustion in serverless
