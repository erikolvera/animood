"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ExistingRating = {
  id: number;
  rating: number | null;
  review_text: string | null;
};

type Review = {
  id: number;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at?: string;
};

type RatingAndReviewsProps = {
  animeId: number;
  userId: string | null;
  initialRating: ExistingRating | null;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Rating form + community reviews live together because submitting a
// rating refreshes the review list when it is open.
export default function RatingAndReviews({
  animeId,
  userId,
  initialRating,
}: RatingAndReviewsProps) {
  const supabase = createClient();

  const [rating, setRating] = useState(initialRating?.rating ?? 0);
  const [reviewText, setReviewText] = useState(initialRating?.review_text ?? "");
  const [existingRatingId, setExistingRatingId] = useState(initialRating?.id ?? null);
  const [submitting, setSubmitting] = useState(false);

  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);

  async function submitAnimeRating() {
    if (!userId) {
      alert("You must be logged in to rate an anime.");
      return;
    }

    if (rating < 1 || rating > 10) {
      alert("Please select a rating from 1 to 10.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("anime_ratings").upsert(
        {
          user_id: userId,
          anime_id: animeId,
          rating: rating,
          review_text: reviewText,
        },
        {
          onConflict: "user_id,anime_id",
        }
      );

      if (error) throw error;

      alert(existingRatingId ? "Rating updated!" : "Rating saved!");

      // Refresh the user's rating so UI stays in sync
      const { data, error: fetchError } = await supabase
        .from("anime_ratings")
        .select("id, rating, review_text")
        .eq("user_id", userId)
        .eq("anime_id", animeId)
        .maybeSingle();

      if (fetchError) {
        console.error(fetchError.message);
      } else if (data) {
        setExistingRatingId(data.id);
        setRating(data.rating ?? 0);
        setReviewText(data.review_text ?? "");
      }

      // If reviews are open, refresh them from the start
      if (showReviews) {
        resetAndLoadReviews();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save rating.");
    } finally {
      setSubmitting(false);
    }
  }

  async function loadReviews(pageToLoad = 0, replace = false) {
    try {
      setReviewsLoading(true);

      const from = pageToLoad * 10;
      const to = from + 9;

      const { data, error } = await supabase
        .from("anime_ratings")
        .select("id, user_id, rating, review_text, created_at, updated_at")
        .eq("anime_id", animeId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newReviews: Review[] = data || [];

      if (replace) {
        setReviews(newReviews);
      } else {
        setReviews((prev) => [...prev, ...newReviews]);
      }

      setHasMoreReviews(newReviews.length === 10);
      setReviewsPage(pageToLoad);
    } catch (err) {
      console.error("Error loading reviews:", err instanceof Error ? err.message : err);
    } finally {
      setReviewsLoading(false);
    }
  }

  async function resetAndLoadReviews() {
    setReviews([]);
    setReviewsPage(0);
    setHasMoreReviews(true);
    await loadReviews(0, true);
  }

  async function handleToggleReviews() {
    const nextValue = !showReviews;
    setShowReviews(nextValue);

    if (nextValue && reviews.length === 0) {
      await resetAndLoadReviews();
    }
  }

  async function handleLoadMoreReviews() {
    if (!hasMoreReviews || reviewsLoading) return;
    await loadReviews(reviewsPage + 1, false);
  }

  return (
    <>
      <h2>Anime Rating / Review</h2>

      {existingRatingId ? (
        <p style={{ color: "green" }}>You already rated this anime. You can update it below.</p>
      ) : (
        <p>You have not rated this anime yet.</p>
      )}

      <div style={{ marginTop: "16px", marginBottom: "24px" }}>
        <label><strong>Rating (1–10)</strong></label>
        <br />
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          style={{ marginTop: "8px", padding: "8px" }}
        >
          <option value={0}>Select rating</option>
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>

        <br /><br />

        <label><strong>Review</strong></label>
        <br />
        <textarea
          placeholder="Write your review..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={5}
          cols={60}
          style={{ marginTop: "8px", padding: "8px" }}
        />

        <br /><br />

        <button onClick={submitAnimeRating} disabled={submitting}>
          {submitting
            ? "Saving..."
            : existingRatingId
              ? "Update Rating"
              : "Submit Rating"}
        </button>
      </div>

      <hr style={{ margin: "24px 0" }} />

      <h2>Community Reviews</h2>

      <button onClick={handleToggleReviews} style={{ marginBottom: "16px" }}>
        {showReviews ? "Hide Reviews" : "Show Reviews"}
      </button>

      {showReviews && (
        <div>
          {reviewsLoading && reviews.length === 0 ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            <>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    border: "1px solid #444",
                    padding: "10px",
                    marginBottom: "10px",
                    borderRadius: "8px",
                    backgroundColor: "#1f2937",
                    color: "#f9fafb",
                  }}
                >
                  <p>
                    <strong>Rating:</strong> {review.rating}/10
                  </p>

                  <p>
                    <strong>Date:</strong> {formatDate(review.created_at)}
                  </p>

                  {userId && review.user_id === userId && (
                    <p style={{ color: "blue" }}><strong>Your review</strong></p>
                  )}

                  <p>{review.review_text || "No written review provided."}</p>
                </div>
              ))}

              {hasMoreReviews && (
                <button
                  onClick={handleLoadMoreReviews}
                  disabled={reviewsLoading}
                >
                  {reviewsLoading ? "Loading..." : "Load 10 More"}
                </button>
              )}

              {!hasMoreReviews && reviews.length > 0 && (
                <p>No more reviews to load.</p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
