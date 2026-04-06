import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";


function Dashboard({ logout }) {
  const navigate = useNavigate();

  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    alert("Logout successful!");
    logout();
  }


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


