import { useState } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"

function Dashboard({ logout }) {
  const navigate = useNavigate()

  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    alert("Logout successful!")
    logout()
  }

  async function handleDeleteAccount() {
    setError("")

    if (confirmText !== "confirm") {
      setError('You must type "confirm" to delete your account.')
      return
    }

    setLoading(true)

    try {
      const {error} = await supabase.rpc("delete_my_account")

      if (error) throw error

      alert("Account deleted successfully")

      await supabase.auth.signOut()
      logout()
      navigate("/login")

    } catch (err) {
      setError(err.message)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div>

      <h2>Dashboard</h2>

      <p>You are logged in.</p>

      <button onClick={handleLogout}>
        Logout
      </button>

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
              disabled={loading}
              style={{
                marginLeft: "10px",
                backgroundColor: "red",
                color: "white",
                padding: "6px 10px",
                borderRadius: "4px"
              }}
            >
              {loading ? "Deleting..." : "Permanently Delete"}
            </button>

            {error && (
              <p style={{ color: "red", marginTop: "10px" }}>
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard