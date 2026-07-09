"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import bgImage from "@/assets/homepage.png";

function DashboardClient() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    alert("Logout successful!");
    // refresh() clears the router cache so server components re-render
    // with the cleared cookie state.
    router.push("/signin");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen w-full bg-center bg-cover bg-no-repeat flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6 mt-130">

        {/* Main Actions */}
        <div className="flex gap-[40px] mt-25">

          {/* Explore Button */}
          <button
            onClick={() => router.push("/explore")}
            className="min-w-[200px] bg-gray-300/90 hover:bg-gray-200 text-black font-semibold py-3 px-6 rounded-full shadow-md transition"
          >
            Explore
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="min-w-[200px] bg-gray-300/90 hover:bg-gray-200 text-black font-semibold py-3 px-6 rounded-full shadow-md transition"
          >
            Log Out
          </button>
        </div>

      </div>
    </div>
  );
}

export default DashboardClient;
