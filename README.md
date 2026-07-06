# AniMood

**Find your next anime by how you feel.** AniMood is a full-stack anime discovery web
app where you can search a huge catalog, build a personal watchlist, get recommendations
tuned to your taste, and — the centerpiece — chat with **MoodBot**, an AI assistant that
turns a sentence about your mood into spot-on anime suggestions.

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
| Front end | React 19, React Router 7 |
| Styling / UI | Tailwind CSS 4, Headless UI, Heroicons |
| Backend / DB | Supabase (hosted Postgres, Auth, Edge Functions) |
| Anime catalog | [Jikan API](https://jikan.moe/) (MyAnimeList data) |
| AI | Google Gemini (`@google/genai`) |
| Build tool | Vite 7 |
| Testing | Vitest + React Testing Library |

## Architecture

```
React (Vite) SPA
   ├─ Supabase Auth ........ accounts, sessions
   ├─ Supabase Postgres .... profiles, watchlist, preferences, cached anime
   │     └─ Row-Level Security policies + triggers (src/database/*.sql)
   ├─ Supabase Edge Function (Deno) ... secure account deletion
   ├─ Jikan API ............ anime catalog, search, details
   └─ Google Gemini ........ MoodBot mood → genre interpretation
```

The database layer is defined as SQL in [`src/database/`](src/database): `schema.sql`
(tables), `policies.sql` (Row-Level Security so users only see their own data), and
`triggers.sql`.

### How MoodBot works

```
User types a mood
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

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # production build
npm run preview    # serve the production build
npm run test       # run the Vitest suite
npm run lint       # run ESLint
```

### Environment variables

Create a `.env` file in the project root:

```bash
VITE_GEMINI_API_KEY=your_google_gemini_api_key
# Supabase project URL and anon key are configured in src/supabaseClient.js
```

> The Supabase **anon** key is safe to expose in the browser — access is governed by the
> Row-Level Security policies in `src/database/policies.sql`. The Gemini key is read from
> `.env` and is **not** committed (`.env` is git-ignored).

## Project structure

```
src/
├── components/
│   ├── NavBar.jsx              # global search + autocomplete
│   ├── explore/MoodBot.jsx     # AI mood chatbot (slide-over)
│   ├── foryou/                 # onboarding reaction cards
│   ├── anime/                  # AnimeCard, AnimeGrid
│   ├── Signup.jsx / loginForm.jsx
│   └── *.test.jsx              # Vitest suites
├── services/
│   ├── aiService.js            # Google Gemini: mood → genres
│   ├── jikanApi.js             # anime catalog client
│   ├── recommendationService.js# scoring + explanations
│   ├── onboardingService.js    # preference onboarding
│   ├── animeCacheService.js    # cache layer
│   └── dedupingService.js      # de-duplicate sequels/spin-offs
├── Pages/                      # Explore, ForYou, WatchList, SearchResults,
│                               #   AnimeDetails, ProfilePage, Dashboard
├── database/                   # schema.sql, policies.sql (RLS), triggers.sql
└── supabaseClient.js

supabase/
└── functions/delete-user/      # Deno edge function for account deletion
```

## Team

A four person project. Contributions span authentication, anime search and
discovery, the recommendation engine, the MoodBot AI assistant, watchlist, and profile
management.
