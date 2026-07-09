import type { Metadata } from "next";
import WatchListClient from "@/components/watchlist/WatchListClient";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default function WatchListPage() {
  return <WatchListClient />;
}
