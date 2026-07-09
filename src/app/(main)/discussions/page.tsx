import type { Metadata } from "next";
import DiscussionBoardClient from "@/components/discussion/DiscussionBoardClient";

export const metadata: Metadata = {
  title: "Discussions",
};

export default function DiscussionsPage() {
  return <DiscussionBoardClient animeId={null} />;
}
