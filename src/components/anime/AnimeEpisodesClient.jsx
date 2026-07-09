"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import EpisodeCard from "./EpisodeCard";

// The server page awaits params and passes the id down, so this
// component doesn't need useParams at all.
function AnimeEpisodesClient({ animeId }) {
  const id = animeId;
  const supabase = createClient();

  const [animeTitle, setAnimeTitle] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [loadingMoreEpisodes, setLoadingMoreEpisodes] = useState(false);
  const [episodePage, setEpisodePage] = useState(1);
  const [hasMoreEpisodes, setHasMoreEpisodes] = useState(true);
  const [visibleEpisodeCount, setVisibleEpisodeCount] = useState(20);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  async function fetchEpisodes(page = 1, replace = false) {
    try {
      if (page === 1) {
        setEpisodesLoading(true);
      } else {
        setLoadingMoreEpisodes(true);
      }

      const response = await fetch(
        `https://api.jikan.moe/v4/anime/${id}/episodes?page=${page}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch episodes");
      }

      const data = await response.json();
      const newEpisodes = data.data || [];

      if (replace) {
        setEpisodes(newEpisodes);
      } else {
        setEpisodes((prev) => [...prev, ...newEpisodes]);
      }

      setEpisodePage(page);
      setHasMoreEpisodes(!!data.pagination?.has_next_page);
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    } finally {
      setEpisodesLoading(false);
      setLoadingMoreEpisodes(false);
    }
  }

  async function handleLoadMoreEpisodes() {
    const nextVisibleCount = visibleEpisodeCount + 20;

    if (nextVisibleCount <= episodes.length) {
      setVisibleEpisodeCount(nextVisibleCount);
      return;
    }

    if (hasMoreEpisodes && !loadingMoreEpisodes) {
      await fetchEpisodes(episodePage + 1, false);
    }

    setVisibleEpisodeCount(nextVisibleCount);
  }

  const hasMoreEpisodesToShow =
    visibleEpisodeCount < episodes.length || hasMoreEpisodes;

  useEffect(() => {
    async function fetchAnimeTitle() {
      try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch anime title");
        }

        const data = await response.json();
        setAnimeTitle(data.data?.title || "Anime");
      } catch (err) {
        console.error(err.message);
      }
    }

    async function fetchCurrentUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching current user:", error.message);
        return;
      }

      setCurrentUser(user);
    }

    setEpisodes([]);
    setEpisodePage(1);
    setHasMoreEpisodes(true);
    setVisibleEpisodeCount(20);
    setError("");

    fetchAnimeTitle();
    fetchCurrentUser();
    fetchEpisodes(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (episodesLoading && episodes.length === 0) {
    return <p style={{ padding: "20px" }}>Loading episodes...</p>;
  }

  if (error && episodes.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <p style={{ color: "red" }}>{error}</p>
        <Link href={`/anime/${id}`}>Back to Anime Details</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Link href={`/anime/${id}`}>← Back to Anime Details</Link>

      <h1>{animeTitle} Episodes</h1>

      {episodes.length === 0 ? (
        <p>No episodes found.</p>
      ) : (
        <div>
          {episodes.slice(0, visibleEpisodeCount).map((episode) => (
            <EpisodeCard
              key={episode.mal_id}
              animeId={parseInt(id)}
              episode={episode}
              currentUser={currentUser}
            />
          ))}

          {hasMoreEpisodesToShow && (
            <button
              onClick={handleLoadMoreEpisodes}
              disabled={loadingMoreEpisodes}
              style={{ marginTop: "12px" }}
            >
              {loadingMoreEpisodes ? "Loading..." : "Load 20 More Episodes"}
            </button>
          )}

          {!hasMoreEpisodesToShow && episodes.length > 0 && (
            <p>No more episodes to load.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AnimeEpisodesClient;
