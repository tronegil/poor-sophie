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
- `/` — public landing page (`pages/Landing.jsx`): the seasickness index for anonymous users, calls `POST /api/passage/score` (no auth, IP rate-limited in `routes/publicPassage.js`). Poor Sophie login is a small link in its footer.
- `/login` — public, redirects to `/dashboard` if already authed
- `/boats/public/:id` — public shareable boat view (no auth required)
- Everything else — wrapped in `ProtectedRoute` → `NavLayout` (Navbar + `<Outlet>`)

### Key conventions
- API client lives in `frontend/src/api/client.js` (axios, `withCredentials: true`, baseURL `/api`)
- Vite proxies `/api/*` → `localhost:3001` in dev — no CORS issues locally
- i18n translations are in `frontend/src/i18n/en.js` and `no.js`; language persisted in `localStorage` and synced to `users.language` in DB via `PUT /api/users/language`
- Boat photos are URL-based in Phase 1 (no file upload)
- Passage planner UI lives in `components/passage/` (`PassagePlanner` owns route/time/speed state, `PassageResults` renders the score); both the boat page and the landing page compose these. Boat presets for the public picker are in `components/passage/boatPresets.js`
- Default language is Norwegian for `nb/nn/no` browsers, else English (`i18n/index.js`)
- Public vs private boats: `GET /api/boats/:id` checks `is_public`; private boats require a valid JWT cookie belonging to the owner

### Database
Single schema file: `backend/db/schema.sql`. Two tables: `users` and `boats`. UUIDs via `pgcrypto`. No ORM — raw `pg` pool queries.

### Vercel deployment
- Root `vercel.json` uses Vercel **services**: `frontend` (Vite, SPA fallback to `index.html`) and `backend` (Express, `server.js`, 60 s maxDuration). Top-level rewrites send `/api/*` to the backend and everything else to the frontend.
- The backend receives the original path *with* the `/api` prefix; `server.js` strips it before the routers (same middleware also makes the Google OAuth callback work locally on port 3001).
- The earlier `experimentalServices` config stopped routing `/api` once Vercel's CLI moved past v51 — don't go back to it.
- For production DB, use Neon with pgBouncer pooler endpoint to avoid connection exhaustion in serverless
