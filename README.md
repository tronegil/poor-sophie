# ⛵ Poor Sophie

> *A public seasickness index for the Norwegian coast — and, behind a small link in the footer, a full-stack web app for managing, maintaining, and having deeply philosophical conversations with your sailboat.*

Built with love, frustration, and an unhealthy number of late nights for **Miss Sophie** — a 1987 Compromis 888 who has survived more deferred maintenance than any boat deserves, and is now finally getting the digital infrastructure she's owed.

If you've ever stood on a dock in the rain, trying to remember whether you winterized the engine last year, or frantically googled "how to bleed diesel fuel system" while your marina neighbors pretend not to watch — **this app is for you.**

---

## 🤔 What is this, exactly?

Two things sharing one deployment:

**🤢 Kvalmeindeks (the Seasickness Index)** — the public front page at `/`. Anyone can plot a passage on the sea chart, pick a boat type, departure and speed, and get a 0–10 seasickness index for the whole trip, hour by hour. No account, no login. Norwegian by default, English on a click.

**⛵ Poor Sophie** — the boat management platform behind the discreet *Log in* link in the footer. It combines:

- 🔐 **Authentication** — Google login, no passwords to lose
- ⛵ **Boat profiles** — your fleet, publicly shareable if you're brave
- 🔧 **Seasonal maintenance planning** — 22 pre-loaded tasks, because antifouling season waits for no one
- 📚 **A searchable knowledge base** — PDFs, manuals, notes, YouTube videos, all in one place
- 🧭 **Gunnar Fokkeslask** — your AI first mate, Chief Officer of Not-Sinking
- 🤢 **Seasickness Score** — plot a passage on the sea chart and find out, in advance, who's going to need the bucket

It runs in your browser, looks good on your phone, and won't judge you for the state of your bilge.

---

## 🚀 Feature Overview

### ✅ Phase 1 — Boat Profiles & Auth
*The foundation. Getting aboard.*

- **Google OAuth** login — one click, no passwords to forget or tattoo on your forearm
- **Boat profiles** with name, type, build year, description, and photo URL
- **Full CRUD** — create, edit, and delete boats (the digital kind is consequence-free)
- **Public sharing** — generate a shareable link so your sailing club can admire Miss Sophie
- **English / Norwegian** language support, persisted per user
- Responsive design with a maritime navy-and-ocean-blue theme

---

### ✅ Phase 2 — Maintenance Planner
*Because "I think I serviced the engine two years ago, maybe" is not a maintenance strategy.*

**22 pre-loaded seasonal tasks** covering everything a sailboat needs across all four seasons:

| Season | Tasks |
|--------|-------|
| 🌸 **Spring** | Antifouling, hull inspection, engine service, rigging check, winch service, safety gear, sea cocks, sail inspection, battery check, through-hull fittings |
| ☀️ **Summer** | Navigation lights, bilge pump test, EPIRB/PLB check, flares expiry |
| 🍂 **Autumn** | Engine winterizing, sail storage, freshwater drain, hull wash & wax, battery maintenance |
| ❄️ **Winter** | Insurance renewal, mooring check, equipment inventory, VHF radio service |

**Additional features:**
- Add your own custom tasks on top of the templates
- Enable / disable any task — irrelevant tasks stay hidden, not deleted (for boats without a VHF or boats that haven't had one "since the incident")
- **Log completed tasks** with date, notes, cost in NOK, and photos
  - Two photo categories: **job photos** and **receipts** (for when the receipts are somehow more depressing than the job photos)
  - Photos are compressed client-side — works great from a phone camera
- **Cost summary** table — NOK totals broken down by season and year, so you can stare at the number and feel things
- **Year selector** — browse any past year's history, or revisit past financial traumas
- Auto-detects the current season on load

---

### ✅ Phase 3 — Boat Wiki
*Every manual, every video, every note. All in one place. No more "I know I saved that PDF somewhere".*

- **Upload PDFs** — engine manuals, class certificates, insurance documents, that 40-page rigging guide you'll definitely read someday
- **Upload text / markdown files** — notes, checklists, procedures
- **Type text directly** — no file needed, just paste your notes into the editor
- **Add web links** — useful resources, manufacturer pages, forum threads, that one Stack Exchange post that saved your engine
- **YouTube videos** — paste a link, get a live embedded player with thumbnail preview right on the card
- **Instant search** — filter all wiki items by title or description
- **Grid and list views** — toggle between card grid and compact list
- Auto-fills the title from the filename when you upload a file
- PDFs open via a secure backend proxy — no Cloudinary auth headaches
- Works offline for already-loaded content

> **Note on PDF storage:** PDFs are uploaded directly to Cloudinary from the browser (bypassing Vercel's 4.5 MB request limit), stored securely in the cloud, and served through the backend. The PDF text is also extracted and stored for the AI assistant.

---

### ✅ Phase 4 — Gunnar Fokkeslask, AI First Mate
*"I've been sailing these waters for thirty years and I have never once forgotten to bleed the fuel system. Unlike some people."*

Each boat gets its own AI assistant — **Gunnar Fokkeslask**, Chief Officer of Not-Sinking.

Gunnar is a weathered, knowledgeable old sea dog powered by Claude (Anthropic). He knows everything in your wiki and your full maintenance history. He will answer your questions, cite his sources, occasionally make a dry sailing joke, and freely admit when the grog has been involved in a decision.

**Ask Gunnar things like:**
- *"When did I last service the engine?"*
- *"What does the manual say about bleeding the fuel system?"*
- *"What have I spent on maintenance this year?"*
- *"Find that YouTube video about replacing the impeller"*
- *"What's the recommended antifouling for the hull?"*
- *"How do I adjust the backstay tensioner?"*

**How it works:**
- All your wiki documents and maintenance logs are sent as context to Claude with each message
- Gunnar always checks your boat's own documents first and cites the source
- Conversation history is saved per user per boat — Gunnar remembers what you talked about last time
- Gunnar responds in English or Norwegian depending on which language you write in
- About 1 in 5 or 6 responses, expect a dry nautical observation. Don't say you weren't warned.

---

### ✅ Phase 5 — Admin Dashboard
*Because someone has to know what's going on.*

A password-free admin panel at `/admin`, accessible only to whitelisted email addresses via the `ADMIN_EMAILS` environment variable. Non-admins are silently redirected to the dashboard — they'll never know it exists.

**What you can see:**

- 📊 **Live stats** — total users, boats, wiki items, maintenance logs, and Gunnar messages at a glance
- 👤 **All users** — name, email, language preference, number of boats, number of AI messages, join date
- ⛵ **All boats** — name, type/year, owner, public/private status, and counts for tasks, logs, wiki items, and chat messages

No delete buttons, no danger zone — it's a read-only overview. The kind of dashboard you open when you want to feel like things are under control, even if they aren't.

---

### ✅ Phase 6 — Seasickness Score
*Because "it looked fine from the pontoon" is how every bad story starts.*

Plot a passage on a real nautical chart, pick a departure time and speed, and get a **0–10 seasickness score** — for the whole trip, for each leg, and for every hour along the way. Not a weather forecast: a *motion* forecast, for *your* boat.

**How it works, in one breath:** the route is split into segments, the wave forecast is fetched for the exact time the boat will be at each one, and a physics model turns waves + speed + heading + hull into the vertical acceleration your inner ear is going to complain about — weighted by frequency and accumulated over time, per ISO 2631-1.

**What goes into it:**

| Input | Source |
|---|---|
| Wave height, peak & mean period, direction, **wind sea vs. swell**, wind, surface current | [MET Norway MyWaveWAM 800 m](https://thredds.met.no/thredds/catalog/fou-hi/mywavewam800current.html) — five coastal domains, read point-by-point over OPeNDAP |
| Same, for open Skagerrak / North Sea / Danish & Swedish waters | [MET Norway WAVEWATCH III 4 km](https://thredds.met.no/thredds/catalog/fou-hi/ww3_4km.html) |
| Last-resort fallback (no period — estimated from height) | [api.met.no](https://api.met.no) Oceanforecast + Locationforecast |
| Tidal phase — rising / falling / slack | [Kartverket Se havnivå](https://vannstand.kartverket.no/tideapi_no.html) |
| Your boat: LOA, displacement, hull type, keel type | The boat profile (new fields — fill them in or get sensible 9 m fin-keeler defaults) |

**What the model actually does:**

- **Encounter period** — head sea at 6 kn turns a 6 s swell into a 4 s pounding; following sea stretches it out. Computed from wave period, boat speed and the angle between course and waves.
- **Hull response** — heave falls off as hull length approaches wavelength; heavier boats (displacement/length ratio) move less; long keels roll less than fin keels; multihulls barely roll but bob quicker.
- **Extras** — short steep seas, cross seas (wind sea and swell > 60° apart), and wind against current each add a little.
- **Frequency weighting** — ISO 2631-1 *W<sub>f</sub>*, peaking at ~0.17 Hz. Quick jolts and long lazy swells count less than the 6-second bob.
- **Accumulation** — Motion Sickness Dose Value, *MSDV = a<sub>w</sub> · √t*, integrated along the route. Five hours of moderate motion can out-score one rough hour. *MSDV ÷ 3* ≈ the percentage of an unadapted crew that will actually be sick.

**What you see:**

- Kartverket's official **sea chart tiles** (over OpenStreetMap for the bits Norway doesn't chart) — click to drop waypoints
- Legs coloured by score, sample points with hover details
- The headline score and band — *Flat calm · Comfortable · Uncomfortable · Bucket ready · Stay ashore*
- **Top three factors** in plain language ("Head sea — pounding into it, encounter period 4.9 s")
- An hour-by-hour timeline and table: waves, swell, wind, current, score
- An ⓘ **"How is this calculated?"** dialog with the model explained in five steps, every data source linked, and the literature it leans on (ISO 2631-1; O'Hanlon & McCauley 1974; McCauley et al. 1976; Lawther & Griffin 1987)

**Public front page (`/`):** the same tool, open to everyone. Pick a boat from a list of ~20 common types on the Norwegian coast (Folkebåt to Colin Archer, with hull data filled in) or type your own, and score away. Backed by `POST /api/passage/score` — unauthenticated, rate-limited to 30 calculations per IP per 10 minutes. Logged-in owners get the same thing per boat, with the hull data from the boat profile.

It's an estimate, not a measurement. Forecasts are forecasts, no two hulls move alike, and people vary enormously. Use it to compare departure times and routes — and to decide who gets the helm.

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, i18next (EN/NO) |
| **Backend** | Node.js, Express, Passport.js (Google OAuth 2.0), JWT in httpOnly cookies |
| **Database** | PostgreSQL — raw `pg` queries, no ORM (an ORM would hide the suffering) |
| **AI** | Anthropic Claude API (`claude-sonnet-4-5`) |
| **Maps** | Leaflet + react-leaflet, Kartverket sea chart WMTS over OpenStreetMap |
| **Ocean data** | MET Norway wave models over OPeNDAP (thredds.met.no), api.met.no, Kartverket tidal API — all free, no keys |
| **File storage** | Cloudinary (PDFs via direct browser upload) |
| **Hosting** | Vercel (monorepo — frontend + backend in one project) |
| **Database hosting** | [Neon](https://neon.tech) with pgBouncer pooler |

---

## 💻 Running Locally

### Prerequisites

- Node.js 18+
- A PostgreSQL database (local install or [Neon free tier](https://neon.tech))
- Google OAuth credentials — [create them here](https://console.cloud.google.com) (takes ~5 minutes, feels like more)
- An Anthropic API key — [get one here](https://console.anthropic.com) (for Gunnar)
- A Cloudinary account — [free tier here](https://cloudinary.com) (for PDF uploads)

### 1. Clone and install

```bash
git clone https://github.com/your-username/poor-sophie.git
cd poor-sophie
npm install && npm install --prefix frontend && npm install --prefix backend
```

### 2. Configure environment

```bash
cp .env.example backend/.env
```

Open `backend/.env` and fill in your values. See the full table below.

### 3. Initialise the database

```bash
psql $DATABASE_URL -f backend/db/schema.sql
```

This is idempotent — safe to re-run. Each phase added tables with `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so running it again won't hurt anything (unlike some maintenance jobs we could mention).

### 4. Start the dev servers

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3001 |

The Vite dev server proxies all `/api/*` requests to the backend automatically — no CORS setup needed locally.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | PostgreSQL connection string |
| `JWT_SECRET` | `some-long-random-string` | Signs auth cookies — keep it secret, keep it safe |
| `GOOGLE_CLIENT_ID` | `123...apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3001/api/auth/google/callback` | OAuth redirect URI |
| `FRONTEND_URL` | `http://localhost:5173` | Used for post-auth redirects |
| `NODE_ENV` | `production` | Set to `production` on Vercel for secure cookies |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | For Gunnar. He needs this to function. |
| `CLOUDINARY_CLOUD_NAME` | `dzqvjzhmu` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `123456789012345` | Cloudinary API key (for deleting PDFs) |
| `CLOUDINARY_API_SECRET` | `abc123...` | Cloudinary API secret |

### Frontend (Vercel Project Settings or `frontend/.env` locally)

| Variable | Example | Description |
|---|---|---|
| `VITE_CLOUDINARY_CLOUD_NAME` | `dzqvjzhmu` | Same cloud name as above |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `PoorSophie` | An **unsigned** upload preset from Cloudinary |

> ⚠️ `VITE_` prefixed variables are baked into the frontend bundle at **build time** by Vite. Adding them to Vercel Project Settings only takes effect after the next deployment.

### Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Create **OAuth 2.0 Client ID** (Web application)
3. Add authorised redirect URIs:
   - Local: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://your-app.vercel.app/api/auth/google/callback`

### Cloudinary setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to **Settings** → **Upload** → **Upload presets**
3. Create a new preset: **Signing mode: Unsigned**, **Resource type: Auto**
4. Note the preset name and your cloud name from the dashboard

---

## 🌍 Deployment (Vercel)

Poor Sophie deploys as a **single Vercel project** from the repo root — frontend and backend in one deployment, using [Vercel services](https://vercel.com/docs/services) in `vercel.json`.

```
/        → frontend (Vite build)
/api/*   → backend (Express serverless)
```

### Steps

1. Import the repo into Vercel. Set **Root Directory** to blank (the project root — not `/backend`, not `/frontend`)
2. Add all environment variables in **Project Settings → Environment Variables** (not Team Settings — those don't propagate to projects)
3. For `DATABASE_URL`, use the Neon **pgBouncer pooler** connection string to avoid connection exhaustion in serverless:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?pgbouncer=true&connection_limit=1
   ```
4. Push to `main` — Vercel builds and deploys automatically

---

## 🗄️ Database Schema

Single schema file: `backend/db/schema.sql`. Apply it with:

```bash
psql $DATABASE_URL -f backend/db/schema.sql
```

| Table | Purpose |
|---|---|
| `users` | Google OAuth users with language preference |
| `boats` | Boat profiles, public/private flag, hull data for the seasickness model (`loa_m`, `displacement_kg`, `hull_type`, `keel_type`) |
| `maintenance_tasks` | Per-boat tasks (template-seeded + custom) |
| `maintenance_logs` | Completion records with date, notes, cost in NOK |
| `maintenance_photos` | Base64 photos attached to log entries |
| `wiki_items` | Wiki entries (PDF via Cloudinary, text, URL, YouTube) |
| `chat_messages` | Gunnar's conversation history, per user per boat |

---

## 📁 Project Structure

```
poor-sophie/
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── pages/          # Route-level components (Landing.jsx and Passage.jsx are lazy-loaded — Leaflet is heavy)
│   │   ├── components/     # Shared UI (components/passage/ = planner, map, results, boat picker & presets, explainer)
│   │   ├── api/client.js   # Axios instance (baseURL /api, withCredentials)
│   │   ├── contexts/       # AuthContext
│   │   └── i18n/           # en.js and no.js translations
│
├── backend/                # Node.js + Express
│   ├── server.js           # App entry point
│   ├── src/
│   │   ├── routes/         # auth, boats, maintenance, wiki, chat, passage (per boat), publicPassage (no auth)
│   │   ├── services/       # waves (OPeNDAP), met (api.met.no), tides (Kartverket), seasickness (the model)
│   │   ├── middleware/      # JWT auth
│   │   └── config/         # DB pool, Passport
│   └── db/schema.sql       # Full DB schema, idempotent
│
└── vercel.json             # Vercel services config (frontend + backend)
```

---

## 🏗️ Architecture Notes

**Auth flow:**
1. Browser hits `/api/auth/google` → Passport.js redirects to Google
2. Google returns to `/api/auth/google/callback` → JWT issued as httpOnly cookie (30-day expiry)
3. All protected routes verify the JWT cookie via `backend/src/middleware/auth.js`
4. Frontend `AuthContext` bootstraps via `GET /api/auth/me` on mount

**Vercel routing:**
- Root `vercel.json` defines two services; top-level rewrites send `/api/*` to the Express service and everything else to the Vite frontend
- Express receives the original `/api/...` path and strips the prefix itself, then mounts routes without it (e.g. `/boats`, `/auth`)
- Vite dev proxy forwards `/api/*` to `localhost:3001` — local dev behaves identically to production

**PDF uploads:**
- Browser uploads directly to Cloudinary (avoids Vercel's hard 4.5 MB request limit)
- Backend receives the Cloudinary URL, fetches the PDF, extracts text with `pdf-parse`, stores URL + text in DB
- PDFs are served back through a backend proxy endpoint (`GET /api/boats/:id/wiki/items/:id/pdf`) so Cloudinary auth isn't exposed to the browser

**AI context:**
- Each chat request includes the full system prompt with all wiki document text + last 50 maintenance log entries
- Conversation history (last 20 messages) is included for continuity
- Documents are truncated per-item at 20,000 chars and total at 80,000 chars to stay well within Claude's context window

**Frontend routing:**
- `/` — public landing page with the seasickness index (no auth)
- `/login` — Google sign-in for Poor Sophie; `/dashboard`, `/boats/…`, `/settings`, `/admin` are behind `ProtectedRoute` as before
- Unknown paths go to `/`

**Seasickness score:**
- `POST /api/boats/:id/passage/score` (owner) and `POST /api/passage/score` (public, hull data in the body, 30 req / IP / 10 min) share one scoring function; nothing is stored
- The route is sampled every ~5 nm (max 14 points). Each sample is one OPeNDAP request for a 5×5 cell neighbourhood (nearest wet cell wins, so positions just inside the coastline still resolve); fetched two at a time, as MET asks for gentle OPeNDAP use
- Grid metadata is cached in memory and only the last ~10 days of each dataset's time axis is read — the aggregations carry years of hourly steps
- Datasets are tried in order: the five MyWaveWAM 800 m `*_curr_be` domains, then WAVEWATCH III 4 km, then api.met.no. The older `mywavewam800{s,m,n}_be` datasets stopped updating in October 2025 but still answer requests — don't use them
- Both wave models use a rotated-pole grid (pole at 140°E / 22°N); `services/waves.js` does the transform
- The model lives in `services/seasickness.js` as pure functions with every coefficient in one `C` object, so it can be tuned (or unit-tested) without touching I/O
- Warm requests take ~1–2 s; a cold start can take 10–20 s, so the backend service runs with `maxDuration: 60`

---

## 🧭 Who is Gunnar Fokkeslask?

Gunnar Fokkeslask is Miss Sophie's AI first mate and Chief Officer of Not-Sinking. He is powered by Claude, deeply knowledgeable about sailing, and has strong opinions about the importance of bleeding fuel systems and not skipping antifouling season.

He responds in the language you write in. He occasionally makes a dry sailing joke. He may or may not have been enjoying a tot of grog when he wrote that last response.

His one job is to make sure Miss Sophie doesn't sink. He takes it very seriously.

---

*Built for Miss Sophie. She's worth it.* ⚓

*— and for all the other neglected, beloved, infuriating, wonderful boats out there that deserve better than a spreadsheet.*
