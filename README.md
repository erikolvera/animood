# AniMood

**Find your next anime by how you feel.** AniMood is a full-stack anime discovery web
app where you can search a huge catalog, build a personal watchlist, get recommendations
tuned to your taste, and — the centerpiece — chat with **MoodBot**, an AI assistant that
turns a sentence about your mood into spot-on anime suggestions.

**🔗 Live demo: [animood-eta.vercel.app](https://animood-eta.vercel.app)**

Built by a four-person team.

---

## Features

- **MoodBot — AI mood-based recommendations.** Tell the chatbot how you're feeling
  ("I had a rough week and want something cozy") and it replies with an empathetic message
  plus three hand-picked anime. Powered by **Google Gemini**, which interprets the mood and
  maps it to genres that drive a live catalog query.
- **Global search with autocomplete.** A persistent navbar searches the full anime
  catalog with type-ahead suggestions and a dedicated results page.
- **Personalized "For You" feed.** A short onboarding flow lets you react to sample
  titles to train your profile; a scoring engine then ranks recommendations and explains
  *why* each was chosen, with a "not interested" control to refine results.
- **Watchlist.** Save anime to a personal list and manage it across sessions.
- **Anime detail pages.** Rich info per title, sourced from the Jikan/MyAnimeList API.
- **Accounts & profiles.** Email/password auth (sign up, sign in/out, password reset)
  with session persistence, a profile page, and account deletion.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components), React 19, TypeScript |
| Styling / UI | Tailwind CSS 4, Headless UI, Heroicons |
| Backend / DB | Supabase (hosted Postgres, Auth via `@supabase/ssr` cookie sessions, Edge Functions) |
| Anime catalog | [Jikan API](https://jikan.moe/) (MyAnimeList data) |
| AI | Google Gemini (`@google/genai`), server-side via a Next.js Route Handler |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel with Git-integrated CI/CD — pushes to `main` auto-deploy to [animood-eta.vercel.app](https://animood-eta.vercel.app); every branch/PR gets a preview URL |

> Originally built as a Vite + React Router SPA, then fully migrated to Next.js —
> server-rendered detail pages, cookie-based auth with middleware route protection,
> and the Gemini API key moved off the client.

## Architecture

```
Next.js 16 (App Router)
   ├─ proxy.ts (middleware) .... Supabase session refresh + route guards
   ├─ Server Components ........ SSR anime detail pages, per-title metadata,
   │                             cached Jikan fetches (revalidate: 1h)
   ├─ /api/moodbot ............. Route Handler proxying Google Gemini
   │                             (API key never ships to the browser)
   ├─ Supabase Auth ............ accounts, cookie sessions (@supabase/ssr)
   ├─ Supabase Postgres ........ profiles, watchlist, preferences, cached anime
   │     └─ Row-Level Security policies + triggers (src/database/*.sql)
   ├─ Supabase Edge Function (Deno) ... secure account deletion
   └─ Jikan API ................ anime catalog, search, details
```

The database layer is defined as SQL in [`src/database/`](src/database): `schema.sql`
(tables), `policies.sql` (Row-Level Security so users only see their own data), and
`triggers.sql`.

### How MoodBot works

```
User types a mood
        │
        ▼
POST /api/moodbot (Next.js Route Handler, auth-gated, key server-side)
        │
        ▼
Google Gemini  ──►  returns strict JSON: { friendly_message, genres: [ids] }
        │
        ▼
Jikan API query (by genre, top-scored)  ──►  filter out sequels/spin-offs
        │
        ▼
Top 3 titles + the friendly message rendered in the chat
```

The AI is prompted to respond with **only** a JSON object — a friendly acknowledgement plus
1–2 Jikan genre IDs — which the app parses and uses to fetch and filter real recommendations.

## My contributions

This was a team project; my primary work was the **MoodBot AI feature**, plus global search,
the watchlist, and the original authentication/testing foundation.

- **Designed and built MoodBot end to end** — the slide-over chat UI (Headless UI dialog,
  typing indicator, message history) and the `aiService` integration with Google Gemini.
- **Prompt-engineered the Gemini call** to return structured JSON (`friendly_message` +
  genre IDs), then wired it to the Jikan API, including **sequel/spin-off filtering** and
  graceful fallbacks for empty results and AI errors.
- **Wrote MoodBot's test suite** (component interactions + AI-service integration, with the
  AI/network calls mocked).
- **Built the global navbar autocomplete search** and the search-results page.
- **Implemented watchlist functionality** and anime detail pages.
- **Created the authentication foundation** — signup form with client-side validation and
  the project's first automated tests (Vitest + React Testing Library), and integrated
  React Router for the auth flow.
- **Migrated the entire app from a Vite SPA to Next.js 16 (App Router)** — Server
  Components with cached data fetching and per-title metadata, cookie-based Supabase auth
  with middleware route protection, and a Route Handler that moved the Gemini API key
  server-side (rotating the previously client-exposed key); kept the full test suite
  (120 tests) green throughout.
- **Deployed to production on Vercel** with Git-integrated CI/CD — pushes to `main`
  build and ship automatically, branches get isolated preview deployments.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm start          # serve the production build
npm run test       # run the Vitest suite
npm run lint       # run ESLint
```

### Environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
GEMINI_API_KEY=your_google_gemini_api_key   # server-only: no NEXT_PUBLIC_ prefix
```

> The Supabase **publishable** key is safe to expose in the browser — access is governed
> by the Row-Level Security policies in `src/database/policies.sql`. The Gemini key has no
> `NEXT_PUBLIC_` prefix, so Next.js keeps it server-side; it is only used inside the
> `/api/moodbot` Route Handler.

### Seeding the anime cache (optional)

The For You feed recommends from a cached catalog. On a fresh Supabase project,
populate it from Jikan's top anime:

```bash
node --env-file=.env.local scripts/seedAnimeCache.mjs 3   # pages of top anime to fetch
```

## Project structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # signin, signup, forgot/reset password (no navbar)
│   ├── (main)/                 # navbar layout: dashboard, explore, search, foryou,
│   │   └── anime/[id]/         #   watchlist, profile, discussions, anime details
│   ├── api/moodbot/route.ts    # Gemini proxy (server-side API key)
│   └── auth/confirm/route.ts   # PKCE token exchange for password reset
├── proxy.ts                    # middleware: session refresh + route guards
├── lib/supabase/               # browser/server/middleware Supabase clients
├── components/
│   ├── layout/NavBar.jsx       # global search + autocomplete
│   ├── explore/MoodBot.jsx     # AI mood chatbot (slide-over)
│   ├── foryou/                 # onboarding reaction cards + For You feed
│   ├── anime/                  # AnimeCard, ratings, watchlist toggle, episodes
│   └── **/*.test.jsx           # Vitest suites (120 tests)
├── services/
│   ├── aiService.ts            # client wrapper for /api/moodbot
│   ├── jikanApi.js             # anime catalog client
│   ├── recommendationService.js# scoring + explanations
│   ├── onboardingService.js    # preference onboarding
│   ├── animeCacheService.js    # cache layer
│   └── dedupingService.js      # de-duplicate sequels/spin-offs
└── database/                   # schema.sql, policies.sql (RLS), triggers.sql

supabase/
└── functions/delete-user/      # Deno edge function for account deletion
scripts/
└── seedAnimeCache.mjs          # seed anime_cache from Jikan top anime
```

## Team

A four person project. Contributions span authentication, anime search and
discovery, the recommendation engine, the MoodBot AI assistant, watchlist, and profile
management.
