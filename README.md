# The Interview Room

A community-driven, full-stack SaaS platform where people share, browse, discuss,
and learn from **real interview experiences** — inspired by Exponent's Interview
Experiences and Reddit's discussion model.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**,
**MongoDB/Mongoose**, **NextAuth**, **Zustand**, **TanStack Query**,
**Typesense**, and a **Python FastAPI** AI microservice.

---

## ✨ Features

- **Authentication** — Google & GitHub OAuth (NextAuth), profiles with avatar/bio,
  user contributions, reputation/karma, and **anonymous posting**.
- **Home feed** — infinite scroll with **Trending / Latest / Top** sorting and
  filters by company, role, location, difficulty, interview type, and outcome.
- **Rich interview posts** — company, role, location, experience level, interview
  date, rounds, outcome, difficulty (1–10), salary range, prep resources,
  round-by-round breakdown, questions asked, tips, and tags.
- **Company & Role pages** — `/company/[slug]` and `/role/[slug]` with aggregated
  stats: difficulty, outcomes, most common questions, trending topics, top
  companies hiring, plus AI insights.
- **Post detail** — upvote/downvote, bookmark, share, **nested comments** with
  replies, edit/delete, and report.
- **Search** — global search with **Typesense** + autocomplete (⌘K), with an
  automatic **MongoDB text-search fallback** when Typesense isn't configured.
- **Community** — votes, comment karma, reputation, follow users, saved posts,
  reporting, notifications.
- **AI features** (FastAPI) — AI summary, mock question generator, and a
  personalized preparation roadmap (LLM-powered with heuristic fallback).
- **Admin dashboard** — moderation queue (reports), user management
  (ban/promote), and an **analytics dashboard** (growth, top companies/roles,
  trending topics).
- **SEO** — dynamic metadata, SSR, JSON-LD structured data, sitemap & robots.
- **UX** — modern SaaS design, mobile-first responsive layout, **dark mode**.

---

## 🏗️ Architecture

```
the-interview-room/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # Route handlers (REST API)
│   │   │   ├── auth/[...nextauth]
│   │   │   ├── posts/ ...        # CRUD + comments
│   │   │   ├── votes, bookmarks, reports, notifications
│   │   │   ├── search, trending, companies, roles
│   │   │   ├── users/ ...        # profile, follow, me
│   │   │   ├── admin/ ...        # stats, reports, users
│   │   │   └── ai/[feature]      # proxy to FastAPI service
│   │   ├── (pages)               # home, post, create, company, role,
│   │   │                         # profile, search, bookmarks, login, admin
│   │   ├── sitemap.ts, robots.ts
│   │   └── layout.tsx, providers.tsx
│   ├── components/               # UI (shadcn-style), feed, post, comments, ai
│   ├── hooks/                    # React Query hooks, use-toast
│   ├── lib/                      # db, auth, typesense, validations, utils, ...
│   ├── models/                   # Mongoose models
│   ├── store/                    # Zustand stores
│   └── types/                    # Shared TS types
├── ai-service/                   # Python FastAPI microservice
├── scripts/                      # seed + typesense sync (tsx)
└── ...config
```

**Clean architecture principles:** route handlers are thin and delegate to
shared helpers (`api-helpers`, `serializers`, `aggregations`); the database
layer is isolated in `models/` + `lib/db`; validation lives in `lib/validations`
(Zod); enum constants are kept server-import-free in `lib/constants` so client
bundles never pull in Mongoose.

### Database collections

`Users`, `Posts`, `Comments`, `Votes`, `Bookmarks`, `Reports`, `Notifications`
— see [`src/models`](src/models).

---

## 🚀 Getting started

### Prerequisites

- Node.js 18.18+ (tested on Node 26)
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- (Optional) Google & GitHub OAuth apps
- (Optional) [Typesense Cloud](https://cloud.typesense.org) for search
- (Optional) Python 3.11+ for the AI service

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values (see `.env.example` for the full list):

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID/SECRET` | ▶ | Google OAuth |
| `GITHUB_CLIENT_ID/SECRET` | ▶ | GitHub OAuth |
| `NEXT_PUBLIC_TYPESENSE_*` / `TYPESENSE_ADMIN_KEY` | ▶ | Typesense (falls back to Mongo) |
| `AI_SERVICE_URL` | ▶ | FastAPI URL (default `http://localhost:8000`) |
| `ADMIN_EMAILS` | ▶ | Comma-separated emails granted the admin role |

> **OAuth callback URLs:**
> Google → `http://localhost:3000/api/auth/callback/google`
> GitHub → `http://localhost:3000/api/auth/callback/github`

### 3. Seed demo data (optional but recommended)

```bash
npm run seed
```

This creates demo users, ~60 posts, and comments so the feed/stats pages are
populated immediately. Add your real email to `ADMIN_EMAILS` to get admin access
on first sign-in.

### 4. Run the app

```bash
npm run dev
# http://localhost:3000
```

### 5. Run the AI service (optional)

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # optionally add OPENAI_API_KEY
uvicorn main:app --reload --port 8000
```

Without `OPENAI_API_KEY` the service (and the Next.js fallback) still returns
useful results using deterministic heuristics.

### 6. Sync Typesense (optional)

```bash
npm run typesense:sync
```

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run seed` | Seed the database with demo data |
| `npm run typesense:sync` | (Re)build the Typesense index from MongoDB |

---

## ☁️ Deployment

### Next.js app → Vercel

1. Push the repo to GitHub and import it into [Vercel](https://vercel.com).
2. Add all environment variables from `.env.local` in the Vercel project
   settings (set `NEXTAUTH_URL` to your production domain).
3. Update OAuth callback URLs to the production domain.
4. Deploy. `mongoose` is configured via `serverExternalPackages` so it runs
   correctly on serverless functions.

### AI service → Render / Fly.io / Railway / Docker

The `ai-service/` ships with a `Dockerfile`:

```bash
cd ai-service
docker build -t interview-room-ai .
docker run -p 8000:8000 --env-file .env interview-room-ai
```

Then point `AI_SERVICE_URL` at the deployed service.

### Database → MongoDB Atlas

Create a free cluster, allow network access, and use the SRV connection string
as `MONGODB_URI`.

### Search → Typesense Cloud

Create a cluster, generate an **admin key** and a **search-only key**, set the
env vars, then run `npm run typesense:sync`.

---

## 🧱 Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui patterns |
| Auth | NextAuth (Google + GitHub, JWT sessions) |
| Database | MongoDB + Mongoose |
| Client state | Zustand |
| Server state | TanStack Query |
| Search | Typesense (+ MongoDB fallback) |
| AI | Python FastAPI (+ optional OpenAI) |
| Validation | Zod |
| Deployment | Vercel + Docker |

---

## 🔐 Notes on security & best practices

- All mutating API routes require an authenticated session (`requireUser` /
  `requireAdmin`) and validate input with Zod.
- Banned users are blocked at the API layer.
- Anonymous posts/comments never leak the author in serialized responses.
- The Mongoose connection is cached to survive serverless cold starts.
- Centralized error handling returns consistent `{ success, error }` envelopes.

---

## 📄 License

MIT — built as a production-ready SaaS MVP reference.
