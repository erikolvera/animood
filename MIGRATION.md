# AniMood → Next.js Migration Guide

Branch: `nextjs-migration`. Plumbing (auth, layout, MoodBot API) and two teaching
examples are done. **Your job: port the 6 remaining routes from `src/legacy-pages/`
following the recipe below.** Delete each legacy file (and its test) once its
port is green.

## Status

| Route | File | Status |
|---|---|---|
| `/signin` `/signup` `/forgot-password` `/reset-password` | `src/app/(auth)/*` | ✅ done (full TSX rewrite example) |
| `/anime/[id]` | `src/app/(main)/anime/[id]/page.tsx` | ✅ done — **Server Component teaching example** |
| `/explore` | `src/app/(main)/explore/page.tsx` | ✅ done — **client page teaching example** |
| `/dashboard` | `src/legacy-pages/Dashboard.jsx` | ⬜ yours (placeholder page exists) — start here, it's 45 lines |
| `/search` | `src/legacy-pages/SearchResults.jsx` | ⬜ yours — copies the Explore pattern |
| `/anime/[id]/episodes` | `src/legacy-pages/AnimeEpisodes.jsx` | ⬜ yours |
| `/watchlist` | `src/legacy-pages/WatchList.jsx` | ⬜ yours — fix `plan_to_watch` → `planned` (DB constraint!) |
| `/discussions` + `/anime/[id]/discussions` | `src/legacy-pages/DiscussionBoard.jsx` | ⬜ yours — ONE shared client component, TWO thin page wrappers |
| `/profile` | `src/legacy-pages/ProfilePage.jsx` | ⬜ yours |
| `/foryou` | `src/legacy-pages/ForYouPage.jsx` | ⬜ yours — biggest, but purely mechanical |

`src/legacy-pages/Signup.jsx` is an unrouted duplicate — just delete it.

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
