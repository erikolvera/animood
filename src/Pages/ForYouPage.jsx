import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { getRecommendations } from "../services/recommendationService";
import { Link } from "react-router-dom";
import OnboardingIntro from "../components/foryou/OnboardingIntro";
import GenrePreferenceStep from "../components/foryou/GenrePreferenceStep";
import ReactionCard from "../components/foryou/ReactionCard";
import {
  getForYouSignalSummary,
  saveGenrePreferences,
  saveOnboardingResponse,
  getOnboardingCandidates,
  resetOnboardingData,
} from "../services/onboardingService";

function ForYouPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [recommendations, setRecommendations] = useState([]);
  const [hasEnoughData, setHasEnoughData] = useState(true);
  const [mode, setMode] = useState("traditional");

  const [savingGenres, setSavingGenres] = useState(false);

  const [expandedWhy, setExpandedWhy] = useState({});
  const [feedbackLoading, setFeedbackLoading] = useState({});

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState("intro");
  const [signalSummary, setSignalSummary] = useState({
    totalSignals: 0,
    minimumSignals: 20,
    profileFavorites: [],
    counts: {
      profileFavorites: 0,
      animeRatings: 0,
      interactions: 0,
      genrePreferences: 0,
      onboardingResponses: 0,
    },
  });

  const [reactionCandidates, setReactionCandidates] = useState([]);
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [savingReactionId, setSavingReactionId] = useState(null);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  const loadRecommendations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      const summary = await getForYouSignalSummary(user.id);
      setSignalSummary(summary);
      setHasEnoughData(summary.hasEnoughData);

      if (!summary.hasEnoughData) {
        setShowOnboarding(true);
        setRecommendations([]);
        setMode("onboarding");
        return;
      }

      setShowOnboarding(false);

      const result = await getRecommendations(user.id);
      setRecommendations(result.recommendations || []);
      setHasEnoughData(result.hasEnoughData);
      setMode(result.mode || "personalized");
    } catch (err) {
      console.error(err);
      setError("Failed to load recommendations");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const loadReactionCandidates = useCallback(async () => {
    try {
      setLoadingReactions(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      const candidates = await getOnboardingCandidates(user.id, 6);
      setReactionCandidates(candidates);
    } catch (err) {
      console.error(err);
      setError("Failed to load onboarding picks");
    } finally {
      setLoadingReactions(false);
    }
  }, []);

  useEffect(() => {
    if (
      showOnboarding &&
      onboardingStep === "reactions" &&
      reactionCandidates.length === 0
    ) {
      loadReactionCandidates();
    }
  }, [
    showOnboarding,
    onboardingStep,
    reactionCandidates.length,
    loadReactionCandidates,
  ]);

  const signalsRemaining = Math.max(
    0,
    (signalSummary.minimumSignals || 20) - (signalSummary.totalSignals || 0)
  );

  function handleOnboardingContinue() {
    setOnboardingStep("genres");
  }

  function handleOnboardingBackToIntro() {
    setOnboardingStep("intro");
  }

  function handleBackToGenres() {
    setOnboardingStep("genres");
  }

  async function handleSaveGenres({ likedGenres, dislikedGenres }) {
    try {
      setSavingGenres(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      await saveGenrePreferences(user.id, likedGenres, dislikedGenres);

      const updatedSummary = await getForYouSignalSummary(user.id);
      setSignalSummary(updatedSummary);
      setHasEnoughData(updatedSummary.hasEnoughData);

      setOnboardingStep("reactions");
      setReactionCandidates([]);
      await loadReactionCandidates();
    } catch (err) {
      console.error(err);
      setError("Failed to save genre preferences");
    } finally {
      setSavingGenres(false);
    }
  }

  async function handleReactionResponse(anime, response) {
    try {
      setSavingReactionId(anime.mal_id);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      await saveOnboardingResponse(user.id, anime, response);

      const nextCandidates = reactionCandidates.filter(
        (item) => item.mal_id !== anime.mal_id
      );
      setReactionCandidates(nextCandidates);

      const updatedSummary = await getForYouSignalSummary(user.id);
      setSignalSummary(updatedSummary);
      setHasEnoughData(updatedSummary.hasEnoughData);

      if (nextCandidates.length <= 2) {
        const newCandidates = await getOnboardingCandidates(user.id, 6);
        setReactionCandidates(newCandidates);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save onboarding response");
    } finally {
      setSavingReactionId(null);
    }
  }

  async function handleFinishOnboarding() {
    try {
      setError("");
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      const result = await getRecommendations(user.id);

      setShowOnboarding(false);
      setRecommendations(result.recommendations || []);
      setHasEnoughData(result.hasEnoughData);
      setMode(result.mode || "personalized");
    } catch (err) {
      console.error(err);
      setError("Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    await loadRecommendations(true);
  }

  async function handleOnboardingSkip() {
    try {
      setError("");
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      const result = await getRecommendations(user.id);
      setShowOnboarding(false);
      setRecommendations(result.recommendations || []);
      setHasEnoughData(result.hasEnoughData);
      setMode(result.mode || "fallback");
    } catch (err) {
      console.error(err);
      setError("Failed to load fallback recommendations");
    } finally {
      setLoading(false);
    }
  }

  async function handleRedoOnboarding() {
    try {
      setResettingOnboarding(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      await resetOnboardingData(user.id);

      const updatedSummary = await getForYouSignalSummary(user.id);
      setSignalSummary(updatedSummary);
      setHasEnoughData(updatedSummary.hasEnoughData);

      setRecommendations([]);
      setExpandedWhy({});
      setFeedbackLoading({});
      setReactionCandidates([]);
      setOnboardingStep("intro");
      setShowOnboarding(true);
      setMode("onboarding");
    } catch (err) {
      console.error(err);
      setError("Failed to reset onboarding");
    } finally {
      setResettingOnboarding(false);
    }
  }

  function toggleWhyThis(malId) {
    setExpandedWhy((prev) => ({
      ...prev,
      [malId]: !prev[malId],
    }));
  }

  async function handleNotInterested(e, anime) {
    e.preventDefault();
    e.stopPropagation();

    setFeedbackLoading((prev) => ({
      ...prev,
      [anime.mal_id]: true,
    }));

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      const { error: upsertError } = await supabase
        .from("user_anime_interactions")
        .upsert(
          [
            {
              user_id: user.id,
              mal_id: anime.mal_id,
              disliked: true,
              liked: false,
              is_favorite: false,
            },
          ],
          { onConflict: "user_id, mal_id" }
        );

      if (upsertError) {
        throw upsertError;
      }

      setRecommendations((prev) =>
        prev.filter((item) => item.mal_id !== anime.mal_id)
      );

      setExpandedWhy((prev) => {
        const updated = { ...prev };
        delete updated[anime.mal_id];
        return updated;
      });

      setFeedbackLoading((prev) => {
        const updated = { ...prev };
        delete updated[anime.mal_id];
        return updated;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to save feedback");
      setFeedbackLoading((prev) => ({
        ...prev,
        [anime.mal_id]: false,
      }));
    }
  }

  if (loading) {
    return <div className="p-4">Loading recommendations...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500 mb-3">{error}</p>
        <button
          onClick={handleRefresh}
          className="border rounded px-3 py-2 hover:bg-gray-100"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleRedoOnboarding}
            disabled={resettingOnboarding}
            className="border rounded px-3 py-2 hover:bg-gray-100 disabled:opacity-60"
          >
            {resettingOnboarding ? "Resetting..." : "Redo Onboarding"}
          </button>
        </div>

        {onboardingStep === "intro" && (
          <OnboardingIntro
            profileFavorites={signalSummary.profileFavorites}
            totalSignals={signalSummary.totalSignals}
            minimumSignals={signalSummary.minimumSignals}
            onContinue={handleOnboardingContinue}
            onSkip={handleOnboardingSkip}
          />
        )}

        {onboardingStep === "genres" && (
          <GenrePreferenceStep
            onSave={handleSaveGenres}
            onBack={handleOnboardingBackToIntro}
            onSkip={handleOnboardingSkip}
            saving={savingGenres}
          />
        )}

        {onboardingStep === "reactions" && (
          <div className="space-y-6">
            <div className="border rounded-2xl p-6 space-y-2">
              <h2 className="text-xl font-bold">Quick picks</h2>

              <p className="text-sm opacity-80">
                Tell us what looks interesting, and we’ll use that to improve
                your first recommendations.
              </p>

              <p className="text-sm opacity-70">
                {hasEnoughData
                  ? "You’ve added enough preference signals to generate personalized recommendations."
                  : `Add ${signalsRemaining} more preference signals for stronger personalized recommendations.`}
              </p>

              <p className="text-xs opacity-60">
                Current signals: {signalSummary.totalSignals} /{" "}
                {signalSummary.minimumSignals}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleBackToGenres}
                className="border rounded px-4 py-2 hover:bg-gray-100"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="border rounded px-4 py-2 hover:bg-gray-100"
              >
                {hasEnoughData
                  ? "Get My Recommendations"
                  : "Continue with Current Preferences"}
              </button>

              <button
                type="button"
                onClick={handleOnboardingSkip}
                className="border rounded px-4 py-2 hover:bg-gray-100"
              >
                Skip for now
              </button>
            </div>

            {loadingReactions ? (
              <div className="border rounded-2xl p-6">
                <p className="text-sm opacity-80">Loading quick picks...</p>
              </div>
            ) : reactionCandidates.length === 0 ? (
              <div className="border rounded-2xl p-6 space-y-3">
                <p className="text-sm opacity-80">
                  No onboarding picks are available right now.
                </p>
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="border rounded px-4 py-2 hover:bg-gray-100"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reactionCandidates.map((anime) => (
                  <ReactionCard
                    key={anime.mal_id}
                    anime={anime}
                    loading={savingReactionId === anime.mal_id}
                    onLike={(selectedAnime) =>
                      handleReactionResponse(selectedAnime, "like")
                    }
                    onUnsure={(selectedAnime) =>
                      handleReactionResponse(selectedAnime, "unsure")
                    }
                    onDislike={(selectedAnime) =>
                      handleReactionResponse(selectedAnime, "dislike")
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">For You</h1>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="border rounded px-3 py-2 hover:bg-gray-100 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh Recommendations"}
          </button>

          <button
            type="button"
            onClick={handleRedoOnboarding}
            disabled={resettingOnboarding}
            className="border rounded px-3 py-2 hover:bg-gray-100 disabled:opacity-60"
          >
            {resettingOnboarding ? "Resetting..." : "Redo Onboarding"}
          </button>
        </div>
      </div>

      {!hasEnoughData && (
        <div className="mb-4 p-3 border rounded">
          <p className="mb-2">
            We need a bit more information to personalize your recommendations.
          </p>
          <Link to="/profile" className="underline">
            Edit your profile favorites
          </Link>
        </div>
      )}

      {mode === "fallback" && (
        <p className="mb-4 text-sm opacity-70">
          Showing popular anime while we learn your preferences.
        </p>
      )}

      {recommendations.length === 0 ? (
        <div className="space-y-3">
          <p>No recommendations available.</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="border rounded px-3 py-2 hover:bg-gray-100 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh Recommendations"}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((anime) => {
            const whyExpanded = !!expandedWhy[anime.mal_id];
            const isFeedbackLoading = !!feedbackLoading[anime.mal_id];

            return (
              <div key={anime.mal_id} className="border rounded p-3">
                <div className="flex gap-4">
                  <Link to={`/anime/${anime.mal_id}`} className="shrink-0">
                    {anime.image_url ? (
                      <img
                        src={anime.image_url}
                        alt={anime.title_english || anime.title}
                        className="w-20 h-28 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-28 border rounded flex items-center justify-center text-xs opacity-60">
                        No Image
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/anime/${anime.mal_id}`}>
                      <h2 className="font-semibold hover:underline">
                        {anime.title_english || anime.title}
                      </h2>
                    </Link>

                    {anime.score && (
                      <p className="text-sm opacity-70 mt-1">
                        Score: {anime.score}
                      </p>
                    )}

                    {anime.genres?.length > 0 && (
                      <p className="text-sm opacity-70 mt-1">
                        Genres:{" "}
                        {anime.genres
                          .map((genre) =>
                            typeof genre === "string" ? genre : genre.name
                          )
                          .filter(Boolean)
                          .slice(0, 3)
                          .join(", ")}
                      </p>
                    )}

                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => toggleWhyThis(anime.mal_id)}
                        className="border rounded px-3 py-1 text-sm hover:bg-gray-100"
                      >
                        {whyExpanded ? "Hide Why This" : "Why This?"}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleNotInterested(e, anime)}
                        disabled={isFeedbackLoading}
                        className="border rounded px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-60"
                      >
                        {isFeedbackLoading ? "Saving..." : "Not Interested"}
                      </button>
                    </div>

                    {whyExpanded && (
                      <div className="mt-3 text-sm">
                        {anime.explanation?.length ? (
                          <ul className="list-disc ml-5 space-y-1">
                            {anime.explanation.map((line, index) => (
                              <li key={index}>{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="opacity-70">
                            This was recommended based on your saved preferences.
                          </p>
                        )}
                      </div>
                    )}

                    {anime.synopsis && (
                      <p className="text-sm mt-3">
                        {anime.synopsis.length > 400
                          ? `${anime.synopsis.slice(0, 400)}...`
                          : anime.synopsis}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ForYouPage;