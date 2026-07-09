import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RatingAndReviews from "@/components/anime/RatingAndReviews";
import WatchlistToggle from "@/components/anime/WatchlistToggle";

type Anime = {
  mal_id: number;
  title: string;
  synopsis: string | null;
  score: number | null;
  episodes: number | null;
  status: string | null;
  rating: string | null;
  images?: { jpg?: { image_url?: string } };
};

// Cached for an hour per anime id: repeat visits skip Jikan entirely,
// which also keeps us under its 3 req/s rate limit. Next dedupes the
// identical fetch between generateMetadata and the page render.
async function getAnime(id: string): Promise<Anime> {
  const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`, {
    next: { revalidate: 3600 },
  });

  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error("Failed to fetch anime details");
  }

  const data = await res.json();
  return data.data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const anime = await getAnime(id);

  return {
    title: anime.title,
    description: anime.synopsis?.slice(0, 160),
  };
}

export default async function AnimeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animeId = Number(id);
  if (!Number.isInteger(animeId)) {
    notFound();
  }

  const supabase = await createClient();

  const [anime, userResult] = await Promise.all([
    getAnime(id),
    supabase.auth.getUser(),
  ]);
  const user = userResult.data.user;

  // Fetch the signed-in user's rating and watchlist state on the server
  // so the interactive widgets render with the right initial state.
  let existingRating = null;
  let inWatchlist = false;

  if (user) {
    const [ratingResult, watchlistResult] = await Promise.all([
      supabase
        .from("anime_ratings")
        .select("id, rating, review_text")
        .eq("user_id", user.id)
        .eq("anime_id", animeId)
        .maybeSingle(),
      supabase
        .from("watchlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("anime_id", animeId)
        .maybeSingle(),
    ]);

    existingRating = ratingResult.data;
    inWatchlist = Boolean(watchlistResult.data);
  }

  const imageUrl = anime.images?.jpg?.image_url ?? null;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{anime.title}</h1>

      {user ? (
        <WatchlistToggle
          animeId={animeId}
          animeTitle={anime.title}
          imageUrl={imageUrl}
          userId={user.id}
          initialInWatchlist={inWatchlist}
        />
      ) : (
        <p style={{ marginBottom: "20px", fontStyle: "italic", color: "#888" }}>
          <Link href="/signin">Log in</Link> to add this to your watchlist.
        </p>
      )}

      {imageUrl && (
        <Image
          src={imageUrl}
          alt={anime.title}
          width={200}
          height={284}
          style={{ height: "auto", borderRadius: "8px", marginBottom: "20px" }}
        />
      )}

      <p><strong>Score:</strong> {anime.score ?? "N/A"}</p>
      <p><strong>Episodes:</strong> {anime.episodes ?? "Unknown"}</p>
      <p><strong>Status:</strong> {anime.status ?? "Unknown"}</p>
      <p><strong>Rating:</strong> {anime.rating ?? "Unknown"}</p>

      <h2>Synopsis</h2>
      <p>{anime.synopsis || "No synopsis available."}</p>

      <hr style={{ margin: "24px 0" }} />

      <RatingAndReviews
        animeId={animeId}
        userId={user?.id ?? null}
        initialRating={existingRating}
      />

      <hr style={{ margin: "24px 0" }} />

      <h2>Episodes</h2>
      <p>View the episode list and rate individual episodes on a separate page.</p>

      <Link
        href={`/anime/${animeId}/episodes`}
        style={{
          display: "inline-block",
          padding: "10px 16px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          textDecoration: "none",
          color: "inherit",
          marginTop: "8px",
        }}
      >
        View Episodes
      </Link>

      <hr style={{ margin: "24px 0" }} />

      {/* Discussion Section */}
      <h2>Community Discussion</h2>
      <p>Share your thoughts and discuss this anime with other fans.</p>
      <Link
        href={`/anime/${animeId}/discussions`}
        className="inline-block mt-2 px-5 py-2.5 rounded-full bg-[#b6353a] text-white text-sm font-medium hover:bg-[#9e2d31] transition-colors"
      >
        Go to Discussion Board
      </Link>
    </div>
  );
}
