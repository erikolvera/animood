import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Dashboard({ logout }) {
  async function handleLogout() {
    await supabase.auth.signOut();
    alert("Logout successful!");
    logout();
  }

  return (
    <div className="px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-3">Animood Dashboard</h1>

      <p className="text-stone-400 mb-6">You are logged in.</p>

      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-full border border-stone-600 text-stone-300 text-sm hover:bg-stone-700 transition-colors"
      >
        Log Out
      </button>
    </div>
  );
}

export default Dashboard;