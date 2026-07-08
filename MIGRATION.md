# AniMood → Next.js Migration Guide

Branch: `nextjs-migration`. **Migration complete** — all 15 routes ported, SPA
remnants deleted, `react-router-dom` uninstalled, `next build` + 120 tests green.
This document is kept as the reference for the patterns used (and for porting any
future pages).

## Status

| Route | File | Status |
|---|---|---|
| `/signin` `/signup` `/forgot-password` `/reset-password` | `src/app/(auth)/*` | ✅ full TSX rewrite example |
| `/anime/[id]` | `src/app/(main)/anime/[id]/page.tsx` | ✅ **Server Component teaching example** |
| `/explore` | `src/app/(main)/explore/page.tsx` | ✅ **client page teaching example** |
| `/dashboard` | `src/components/dashboard/DashboardClient.jsx` | ✅ |
| `/search` | `src/components/search/SearchResultsClient.jsx` | ✅ Suspense + useSearchParams |
| `/anime/[id]/episodes` | `src/components/anime/AnimeEpisodesClient.jsx` | ✅ server page passes awaited param as prop |
| `/watchlist` | `src/components/watchlist/WatchListClient.jsx` | ✅ incl. `plan_to_watch` → `planned` fix |
| `/discussions` + `/anime/[id]/discussions` | `src/components/discussion/DiscussionBoardClient.jsx` | ✅ one component, two thin wrappers |
| `/profile` | `src/components/profile/ProfileClient.jsx` | ✅ incl. undefined-logout-prop fix |
| `/foryou` | `src/components/foryou/ForYouClient.jsx` | ✅ mechanical client port |

Remaining: the manual dashboard tasks below, then the Vercel deploy.

## The two patterns (study these first)

1. **Client page** (what you'll do most): `src/app/(main)/explore/page.tsx` +
   `src/components/explore/ExploreClient.jsx`. Page body moves to a
   `'use client'` component; `page.tsx` is a thin server wrapper that sets
   `metadata` and (only if the component uses `useSearchParams`) wraps it in
   `<Suspense>`.
2. **Server page** (use when data can load before render):
   `src/app/(main)/anime/[id]/page.tsx` — `await params`, cached `fetch`,
   `generateMetadata`, interactive bits extracted to client components with
   initial state passed as props.

`src/components/layout/NavBar.jsx` shows the minimal-diff `.jsx` port style
(NavLink → `usePathname()` + `Link`).

## Per-page recipe

1. Create `src/app/(main)/<route>/page.tsx` (thin wrapper + `metadata`).
2. Move the legacy page body to `src/components/<feature>/XxxClient.jsx`, add
   `'use client'` at the top.
3. Apply the import mapping table:

| react-router-dom | Next.js |
|---|---|
| `useNavigate()` / `navigate("/x")` | `useRouter()` from `next/navigation` / `router.push("/x")` |
| `useParams()` | client: same name, from `next/navigation`; server: `const { id } = await params` |
| `const [sp, setSp] = useSearchParams()` | `useSearchParams()` (read-only) + `router.push(\`${pathname}?${qs}\`)` — page.tsx needs `<Suspense>` |
| `<Link to="/x">` / `<NavLink>` | `<Link href="/x">` from `next/link` / compare `usePathname()` |
| `<Navigate to="/x" />` | server: `redirect("/x")`; client: `router.replace("/x")` in an effect |
| `import { supabase } from "../supabaseClient"` | `import { createClient } from "@/lib/supabase/client"` then `const supabase = createClient()` |
| `import bg from "../assets/x.png"` | same import, but use `bg.src` inside `url(...)` styles |

4. Port the colocated test (reference: `src/components/explore/ExploreClient.test.jsx`):
   - Delete the `MemoryRouter` wrapper — render the component directly.
   - `vi.mock("next/navigation", ...)` with `vi.hoisted` spies (see any ported test).
   - Key mental shift: **the URL is a test input** (mock `useSearchParams`),
     **navigation is a test output** (assert on `router.push`).
   - Mock supabase with `vi.mock("@/lib/supabase/client", ...)` (see
     `RatingAndReviews.test.jsx` for chained query mocks).
5. Smoke test in the browser (`npm run dev`), run `npx vitest run`, then delete
   the legacy page + test in the same commit.

## Per-page notes

- **Dashboard**: replaces the placeholder `src/app/(main)/dashboard/page.tsx`.
  Its `logout` prop is gone — call `supabase.auth.signOut()` then
  `router.push("/signin"); router.refresh()` directly.
- **SearchResults**: reads `?q=` → same `useSearchParams` + `<Suspense>` dance as Explore.
- **AnimeEpisodes**: client `useParams()` keeps working, or go server-style like `/anime/[id]`. Route: `src/app/(main)/anime/[id]/episodes/page.tsx`.
- **WatchList**: the `<option value="plan_to_watch">` doesn't match the DB check
  constraint (`planned`) — fix while porting.
- **DiscussionBoard**: one `DiscussionBoardClient` with an optional `animeId` prop;
  wrappers at `(main)/discussions/page.tsx` and `(main)/anime/[id]/discussions/page.tsx`
  (the second passes `await params` down).
- **ForYouPage**: keep it a client component wholesale; move
  `import "../styles/forYou.css"` along with it (adjust the relative path).

## Gotchas that will bite

- `params`/`searchParams` are **Promises** in server components (`await` them). Client hooks are unchanged.
- Forgot `<Suspense>` around a `useSearchParams` user → `next build` fails.
- Server code: always `getUser()`, never `getSession()`.
- Don't rename folders to `pages/` or `Pages/` — macOS is case-insensitive and Next will treat it as the legacy Pages Router (this actually happened).
- Stop the dev server before `npm install` — installing under a running watcher corrupted node_modules twice.

## Your non-code tasks (dashboard clicks, one-time)

1. **Rotate the Gemini key** in Google AI Studio (the old one shipped in Vite bundles), update `GEMINI_API_KEY` in `.env.local`.
2. **Supabase → Auth → Email Templates → Reset Password**: change the link to
   `<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset password</a>`
3. **Supabase → Auth → URL Configuration**: add `http://localhost:3000/**` to allowed redirect URLs (prod URLs come at deploy time).

## Commands

```bash
npm run dev        # http://localhost:3000
npx vitest run     # full suite (currently 120 tests green)
npm run build      # must stay green after every page you port
```

When all rows are ✅: cleanup phase (delete `src/App.jsx`, `src/main.jsx`,
`src/supabaseClient.js`, `src/App.css`, `npm uninstall react-router-dom`) and
then the Vercel deploy.
