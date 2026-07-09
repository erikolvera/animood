import { Suspense } from "react";
import type { Metadata } from "next";
import SearchResultsClient from "@/components/search/SearchResultsClient";

export const metadata: Metadata = {
  title: "Search",
};

// SearchResultsClient reads ?q= via useSearchParams, so it must render
// inside a Suspense boundary.
export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-5">Loading results...</p>}>
      <SearchResultsClient />
    </Suspense>
  );
}
