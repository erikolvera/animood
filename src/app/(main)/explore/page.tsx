import { Suspense } from "react";
import type { Metadata } from "next";
import ExploreClient from "@/components/explore/ExploreClient";

export const metadata: Metadata = {
  title: "Explore",
};

// useSearchParams() forces client rendering for the subtree, so Next
// requires a Suspense boundary here — `next build` fails without it.
export default function ExplorePage() {
  return (
    <Suspense fallback={<p className="p-5 text-white">Loading...</p>}>
      <ExploreClient />
    </Suspense>
  );
}
