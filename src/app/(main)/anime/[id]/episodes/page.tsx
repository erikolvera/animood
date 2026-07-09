import type { Metadata } from "next";
import AnimeEpisodesClient from "@/components/anime/AnimeEpisodesClient";

export const metadata: Metadata = {
  title: "Episodes",
};

export default async function AnimeEpisodesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnimeEpisodesClient animeId={id} />;
}
