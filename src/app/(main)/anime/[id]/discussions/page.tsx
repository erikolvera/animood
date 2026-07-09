import type { Metadata } from "next";
import DiscussionBoardClient from "@/components/discussion/DiscussionBoardClient";

export const metadata: Metadata = {
  title: "Discussion Board",
};

export default async function AnimeDiscussionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DiscussionBoardClient animeId={id} />;
}
