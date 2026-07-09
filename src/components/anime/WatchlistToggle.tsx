"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WatchlistToggleProps = {
  animeId: number;
  animeTitle: string;
  imageUrl: string | null;
  userId: string;
  initialInWatchlist: boolean;
};

// The server page fetches the initial watchlist state and passes it down;
// this component only owns the mutation.
export default function WatchlistToggle({
  animeId,
  animeTitle,
  imageUrl,
  userId,
  initialInWatchlist,
}: WatchlistToggleProps) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function toggleWatchlist() {
    setLoading(true);

    try {
      if (inWatchlist) {
        const { error } = await supabase
          .from("watchlists")
          .delete()
          .eq("user_id", userId)
          .eq("anime_id", animeId);

        if (error) throw error;
        setInWatchlist(false);
      } else {
        const { error } = await supabase.from("watchlists").insert([
          {
            user_id: userId,
            anime_id: animeId,
            title: animeTitle ?? null,
            image_url: imageUrl,
          },
        ]);

        if (error) throw error;
        setInWatchlist(true);
      }
    } catch (err) {
      console.error("Watchlist error:", err);
      alert(err instanceof Error ? err.message : "Failed to update watchlist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      style={{ marginBottom: "20px", padding: "8px 12px", cursor: "pointer", borderRadius: "8px" }}
    >
      {loading
        ? "Updating..."
        : inWatchlist
          ? "Remove from Watchlist"
          : "Add to Watchlist"}
    </button>
  );
}
