# ⛵ Poor Sophie

> A full-stack web app for managing, maintaining, and documenting your sailboat — built with love for **Miss Sophie**, a 1987 Compromis 888 who deserves better than a spreadsheet.

Poor Sophie started as a simple boat profile manager and has grown into a proper digital logbook: seasonal maintenance tracking, cost summaries, a searchable knowledge base, YouTube manuals, scanned receipts, and more. Built to be used on the dock with a phone in one hand and a coffee in the other.

---

## 🚀 Phases

### ✅ Phase 1 — Boat Profiles & Auth
*The foundation. Getting aboard.*

- **Google OAuth** login — one click, no passwords to forget
- **Boat profiles** with name, type, build year, description, and photo URL
- **Create, edit, and delete** boats
- **Public sharing** — generate a shareable link for each boat that anyone can view, no login needed
- **English / Norwegian** language support throughout, persisted per user
- Responsive design with a maritime navy-and-ocean-blue theme

---

### ✅ Phase 2 — Maintenance Planner
*Because antifouling season waits for no one.*

- **22 pre-loaded template tasks** across all four seasons, covering everything a sailboat needs:
  - 🌸 **Spring** — antifouling, hull inspection, engine service, rigging check, winch service, safety gear, sea cocks, sail inspection, battery check, through-hull fittings
  - ☀️ **Summer** — navigation lights, bilge pump test, EPIRB/PLB check, flares expiry
  - 🍂 **Autumn** — engine winterizing, sail storage, freshwater drain, hull wash & wax, battery maintenance
  - ❄️ **Winter** — insurance renewal, mooring check, equipment inventory, VHF radio service
- **Add your own custom tasks** on top of the template for each season
- **Enable / disable** any task — irrelevant tasks stay hidden, not deleted
- **Log completed tasks** with date, notes, cost in NOK, and photos
  - Two photo categories per log entry: **job photos** and **receipts**
  - Photos are compressed client-side before upload — works great from a phone camera
- **Cost summary** table — NOK totals broken down by season and year
- **Year selector** — browse any past year's history
- Auto-detects the current season on page load

---

### ✅ Phase 3 — Boat Wiki
*Every manual, every video, every note. All in one place.*

- **Upload PDFs** — engine manuals, class certificates, insurance documents
- **Upload text / markdown files** — notes, checklists, procedures
- **Type text directly** — no file needed, just paste your notes into the editor
- **Add web links** — useful resources, manufacturer pages, forum threads
- **YouTube videos** — paste a link, get a live embedded player with thumbnail preview right on the card
- **Instant search** — filter all wiki items by title or description
- **Grid and list views** — toggle between card grid and compact list
- Auto-fills the title from the filename when you upload a file
- PDFs open in a new browser tab via blob URL — works on mobile without any app
- Works offline for already-loaded content

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, i18next (EN/NO) |
| **Backend** | Node.js, Express, Passport.js (Google OAuth 2.0), JWT in httpOnly cookies |
| **Database** | PostgreSQL — raw `pg` queries, no ORM |
| **Hosting** | Vercel (monorepo — frontend + backend in one project) |
| **Database hosting** | [Neon](https://neon.tech) with pgBouncer pooler |

---

## 💻 Running Locally

### Prerequisites

- Node.js 18+
- A PostgreSQL database (local install or [Neon free tier](https://neon.tech))
- Google OAuth credentials — [create them here](https://console.cloud.google.com) (takes ~5 minutes)

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

Open `backend/.env` and fill in your values (see the full list below).

### 3. Initialise the database

```bash
psql $DATABASE_URL -f backend/db/schema.sql
```

This is idempotent — safe to re-run after each phase adds new tables.

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

All variables live in `backend/.env`. None are needed in the frontend for local development.

| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | PostgreSQL connection string |
| `JWT_SECRET` | `some-long-random-string` | Signs the auth cookies — keep it secret |
| `GOOGLE_CLIENT_ID` | `123...apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3001/api/auth/google/callback` | OAuth redirect — change to your domain in prod |
| `FRONTEND_URL` | `http://localhost:5173` | Used for post-auth redirects — change to your domain in prod |
| `NODE_ENV` | `production` | Set to `production` on Vercel to enable secure cookies |

### Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Create **OAuth 2.0 Client ID** (Web application)
3. Add authorised redirect URIs:
   - Local: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://your-app.vercel.app/api/auth/google/callback`

---

## 🌍 Deployment (Vercel)

Poor Sophie deploys as a **single Vercel project** from the repo root — frontend and backend in one deployment.

The `vercel.json` at the root uses `experimentalServices` to wire up both:

```
/        → frontend (Vite build)
/api/*   → backend (Express serverless)
```

### Steps

1. Import the repo into Vercel and set **Root Directory** to blank (project root)
2. Add all environment variables from the table above in the Vercel dashboard
3. For `DATABASE_URL`, use the Neon **pgBouncer pooler** connection string (avoids connection exhaustion in serverless):
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?pgbouncer=true&connection_limit=1
   ```
4. Push to `main` — Vercel builds and deploys automatically

---

## 🗄️ Database Schema

The schema is a single file at `backend/db/schema.sql`. Apply it with:

```bash
psql $DATABASE_URL -f backend/db/schema.sql
```

| Table | Purpose |
|---|---|
| `users` | Google OAuth users with language preference |
| `boats` | Boat profiles, public/private flag |
| `maintenance_tasks` | Per-boat tasks (template-seeded + custom) |
| `maintenance_logs` | Completion records with date, notes, cost |
| `maintenance_photos` | Base64 photos attached to log entries |
| `wiki_items` | Wiki entries (PDF, text, URL, YouTube) |

---

## 🤖 Coming Soon — Phase 4: AI Assistant

*The big one.*

Each boat will get its own AI assistant that knows everything about it. Ask it anything:

- *"When did I last service the engine?"*
- *"What does the manual say about bleeding the fuel system?"*
- *"What have I spent on maintenance this year?"*
- *"Find that YouTube video about replacing the impeller"*

The assistant will search across maintenance logs, wiki documents, and the web — all in context of **your specific boat**. Conversation history saved per user. Available in English and Norwegian, naturally.

---

*Built for Miss Sophie. She's worth it.* ⚓
