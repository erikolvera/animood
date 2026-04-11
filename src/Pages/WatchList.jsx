import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function WatchList() {
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusOptions = [
    { value: "plan_to_watch", label: "Plan to Watch" },
    { value: "watching", label: "Watching" },
    { value: "completed", label: "Completed" },
    { value: "dropped", label: "Dropped" },
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("USER:", user);
      if (userError) console.error("User error:", userError);

      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("watchlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("WATCHLIST DATA:", data);
      if (error) console.error("Watchlist error:", error);

      setWatchlist(data || []);
      setLoading(false);
    }

    loadData();
  }, []);

  async function updateStatus(itemId, newStatus) {
  try {
    console.log("Updating status:", { itemId, newStatus });

    const { data, error } = await supabase
      .from("watchlists")
      .update({ status: newStatus })
      .eq("id", itemId)
      .select();

    if (error) throw error;

    console.log("Updated rows:", data);

    setWatchlist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );

    console.log("Current auth user id:", user?.id);

  } catch (err) {
    console.error("Status update error:", err);
    alert(err.message || "Failed to update status.");
  }
}

  async function removeFromWatchlist(itemId) {
    try {
      const { error } = await supabase
        .from("watchlists")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setWatchlist((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Remove error:", err);
      alert(err.message || "Failed to remove item.");
    }
  }

  if (loading) {
    return <p>Loading watchlist...</p>;
  }

  return (
    <div>
      <h1>Watchlist</h1>

      {!user && <p>Login to See Watchlist</p>}

      {user && watchlist.length === 0 && (
        <div>
          <p>watchlist is empty.</p>
          <Link to="/explore">
            <button>Start Adding to Watchlist</button>
          </Link>
        </div>
      )}

      {watchlist.map((item) => (
        <div key={item.id}>
          <h2>{item.title}</h2>

          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.title}
              width="180"
            />
          )}

          <p>ID: {item.anime_id}</p>

          <p>
            <Link to={`/anime/${item.anime_id}`}>View Details</Link>
          </p>

          <label>Status: </label>
          <select
            value={item.status}
            onChange={(e) => updateStatus(item.id, e.target.value)}
            style={{ color: "black", backgroundColor: "white" }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <br />
          <br />

          <button onClick={() => removeFromWatchlist(item.id)}>
            Remove from Watchlist
          </button>

          <hr />
        </div>
      ))}
    </div>
  );
}