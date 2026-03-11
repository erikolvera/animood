import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function AnimeDetails() {
  const { id } = useParams();

  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnimeDetails() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);

        if (!response.ok) {
          throw new Error("Failed to fetch anime details");
        }

        const data = await response.json();
        setAnime(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchEpisodes() {
      try {
        setEpisodesLoading(true);

        const response = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`);

        if (!response.ok) {
          throw new Error("Failed to fetch episodes");
        }

        const data = await response.json();
        setEpisodes(data.data || []);
      } catch (err) {
        console.error(err.message);
      } finally {
        setEpisodesLoading(false);
      }
    }

    fetchAnimeDetails();
    fetchEpisodes();
  }, [id]);

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading anime details...</p>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <p style={{ color: "red" }}>{error}</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  if (!anime) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Anime not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/dashboard">← Back to Dashboard</Link>

      <h1>{anime.title}</h1>

      {anime.images?.jpg?.image_url && (
        <img
          src={anime.images.jpg.image_url}
          alt={anime.title}
          width="200"
          style={{ borderRadius: "8px", marginBottom: "20px" }}
        />
      )}

      <p><strong>Score:</strong> {anime.score ?? "N/A"}</p>
      <p><strong>Episodes:</strong> {anime.episodes ?? "Unknown"}</p>
      <p><strong>Rating:</strong> {anime.rating ?? "Unknown"}</p>

      <h2>Synopsis</h2>
      <p>{anime.synopsis || "No synopsis available."}</p>

      <hr style={{ margin: "24px 0" }} />

      <h2>Anime Rating / Review</h2>
      <button disabled>Rate Anime (work in progress)</button>

      <hr style={{ margin: "24px 0" }} />

      <h2>Episodes</h2>

      {episodesLoading ? (
        <p>Loading episodes...</p>
      ) : episodes.length === 0 ? (
        <p>No episodes found.</p>
      ) : (
        <div>
          {episodes.map((episode) => (
            <div
              key={episode.mal_id}
              style={{
                border: "1px solid #ccc",
                padding: "12px",
                marginBottom: "12px",
                borderRadius: "8px",
              }}
            >
              <p>
                <strong>Episode {episode.mal_id}:</strong> {episode.title}
              </p>

              {episode.aired && (
                <p>
                    <strong>Aired:</strong> {new Date(episode.aired).toLocaleDateString(
                    "en-US",
                    {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }
                    )}
                </p>
              )}

              <button disabled>Rate Episode (work in progress)</button>
            </div>
          ))}
        </div>
      )}

      
    </div>
  );
}

export default AnimeDetails;