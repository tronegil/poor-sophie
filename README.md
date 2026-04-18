# Poor Sophie

A responsive web app for managing sailboat profiles, maintenance logs, and documentation.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, i18next |
| Backend  | Node.js, Express, Passport.js (Google OAuth) |
| Database | PostgreSQL |
| Hosting  | Vercel (frontend + backend), Neon (database) |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local or hosted — [Neon](https://neon.tech) works great with Vercel)
- Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)

### 1. Install dependencies

```bash
npm install && npm install --prefix frontend && npm install --prefix backend
```

### 2. Configure environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env` with your values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3001/api/auth/google/callback` (dev) |
| `JWT_SECRET` | Any long random string |
| `FRONTEND_URL` | `http://localhost:5173` (dev) |

### 3. Initialize the database

```bash
psql $DATABASE_URL -f backend/db/schema.sql
```

### 4. Run

```bash
npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:3001

## Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google+ API**
3. Create **OAuth 2.0 credentials** (Web application type)
4. Add authorized redirect URIs:
   - Dev: `http://localhost:3001/api/auth/google/callback`
   - Prod: `https://<your-backend>.vercel.app/api/auth/google/callback`

## Deployment

### Frontend → Vercel

Set the **Root Directory** to `frontend/`. No build environment variables needed unless the backend is on a separate domain.

### Backend → Vercel

Set the **Root Directory** to `backend/`. Add all variables from `.env.example` in the Vercel dashboard. For production PostgreSQL, use Neon's connection string with the pooler endpoint (`?pgbouncer=true&connection_limit=1`).

## Phases

- **Phase 1** ✅ Google OAuth, boat profiles (create/edit/delete), public sharing, EN/NO language switching
- **Phase 2** — Seasonal maintenance tasks, cost tracking in NOK
- **Phase 3** — Document wiki (PDFs, URLs, YouTube)
- **Phase 4** — AI assistant per boat
