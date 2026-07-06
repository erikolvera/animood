import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Placeholder — Erik: port src/Pages/Dashboard.jsx here (Phase 6).
export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="opacity-70">
        Coming soon: port <code>src/Pages/Dashboard.jsx</code> here.
      </p>
    </main>
  );
}
