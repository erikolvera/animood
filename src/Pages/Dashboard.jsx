import { supabase } from "../supabaseClient"

function Dashboard({ logout }) {

  async function handleLogout() {
    await supabase.auth.signOut()
    alert("Logout successful!")
    logout()
  }

  return (
    <div>

      <h2>Dashboard</h2>

      <p>You are logged in.</p>

      <button onClick={handleLogout}>
        Logout
      </button>

    </div>
  )
}

export default Dashboard