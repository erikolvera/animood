import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { searchAnime } from "../services/jikanApi";

function Dashboard({ logout }) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [animeResults, setAnimeResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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
          setSearchError("");
          return;
        }

        try {
          setSearchLoading(true);
          setSearchError("");

          const results = await searchAnime(query);
          setAnimeResults(results);
        } catch (err) {
          setSearchError(err.message);
        } finally {
          setSearchLoading(false);
        }
      }

      fetchAnime();
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  async function handleDeleteAccount() {
    setDeleteError("");

    if (confirmText !== "confirm") {
      setDeleteError('You must type "confirm" to delete your account.');
      return;
    }

    setDeleteLoading(true);

    try {
      const { error } = await supabase.rpc("delete_my_account");

      if (error) throw error;

      alert("Account deleted successfully");

      await supabase.auth.signOut();
      logout();
      navigate("/signup");
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

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

      {searchLoading && <p>Loading...</p>}
      {searchError && <p style={{ color: "red" }}>{searchError}</p>}

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

      <div style={{ marginTop: "40px" }}>
        {!showDelete && (
          <button
            onClick={() => setShowDelete(true)}
            style={{ color: "red", fontSize: "0.8rem" }}
          >
            Delete Account
          </button>
        )}

        {showDelete && (
          <div style={{ marginTop: "10px" }}>
            <p style={{ color: "red" }}>
              Type <b>confirm</b> to permanently delete your account.
            </p>

            <input
              placeholder='Type "confirm"'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="border p-2 rounded"
            />

            <button
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              style={{
                marginLeft: "10px",
                backgroundColor: "red",
                color: "white",
                padding: "6px 10px",
                borderRadius: "4px",
              }}
            >
              {deleteLoading ? "Deleting..." : "Permanently Delete"}
            </button>

            {deleteError && (
              <p style={{ color: "red", marginTop: "10px" }}>
                {deleteError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;