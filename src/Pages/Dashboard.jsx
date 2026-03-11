import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { searchAnime } from "../services/jikanApi";

function Dashboard({ logout }) {
  const [query, setQuery] = useState("");
  const [animeResults, setAnimeResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    await supabase.auth.signOut();
    alert("Logout successful!");
    logout();
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      async function fetchAnime() {
        if (!query.trim()) {
          setAnimeResults([]);
          return;
        }

        try {
          setLoading(true);
          setError("");

          const results = await searchAnime(query);
          setAnimeResults(results);

        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }


      fetchAnime();
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div style={{ padding: "20px" }}>

      <h1>Animood Dashboard</h1>

      <h2>Search Anime</h2>

      <input
        type="text"
        placeholder="Search for an anime..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "10px",
          marginBottom: "20px",
        }}
      />

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div>
        {animeResults.map((anime) => (
          <Link
            key={anime.mal_id}
            to={`/anime/${anime.mal_id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                border: "1px solid #ccc",
                padding: "12px",
                marginBottom: "12px",
                borderRadius: "8px",
              }}
            >
              <h4>{anime.title}</h4>

              {anime.images?.jpg?.image_url && (
                <img
                  src={anime.images.jpg.image_url}
                  alt={anime.title}
                  width="120"
                />
              )}

              <p>{anime.synopsis?.slice(0, 200) || "No synopsis available."}</p>
              <p>Score: {anime.score ?? "N/A"}</p>
              <p>Episodes: {anime.episodes ?? "Unknown"}</p>
            </div>
          </Link>
        ))}
      </div>

      <hr />

      <p>You are logged in.</p>

      <button onClick={handleLogout}>Logout</button>
      
    </div>
  );
}

export default Dashboard;