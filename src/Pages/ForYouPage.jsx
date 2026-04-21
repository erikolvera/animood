import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import OnboardingIntro from "../components/foryou/OnboardingIntro";
import GenrePreferenceStep from "../components/foryou/GenrePreferenceStep";
import ReactionCard from "../components/foryou/ReactionCard";
import {
  getForYouSignalSummary,
  saveGenrePreferences,
  getOnboardingCandidates,
  saveOnboardingResponse,
  resetOnboardingData,
} from "../services/onboardingService";

function ForYouPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState("intro");

  const [savingGenres, setSavingGenres] = useState(false);
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [savingReactionId, setSavingReactionId] = useState(null);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  const [signalSummary, setSignalSummary] = useState({
    totalSignals: 0,
    hasEnoughData: false,
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

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not logged in");
      }

      const summary = await getForYouSignalSummary(user.id);
      setSignalSummary(summary);
      setShowOnboarding(!summary.hasEnoughData);
      setOnboardingStep("intro");
      setReactionCandidates([]);
    } catch (err) {
      console.error(err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
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

  function handleOnboardingSkip() {
    setShowOnboarding(false);
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

      const updatedSummary = await getForYouSignalSummary(user.id);
      setSignalSummary(updatedSummary);
      setShowOnboarding(false);
    } catch (err) {
      console.error(err);
      setError("Failed to finish onboarding");
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
      setReactionCandidates([]);
      setShowOnboarding(true);
      setOnboardingStep("intro");
    } catch (err) {
      console.error(err);
      setError("Failed to reset onboarding");
    } finally {
      setResettingOnboarding(false);
    }
  }

  if (loading) {
    return <div className="p-4">Loading recommendations...</div>;
  }

  if (error) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-red-500">{error}</p>
        <button
          type="button"
          onClick={loadRecommendations}
          className="border rounded px-3 py-2 hover:bg-gray-100"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="p-4 max-w-6xl mx-auto space-y-4">
        <div className="flex justify-end">
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
                {signalSummary.hasEnoughData
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
                {signalSummary.hasEnoughData
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
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold">For You</h1>

        <button
          type="button"
          onClick={handleRedoOnboarding}
          disabled={resettingOnboarding}
          className="border rounded px-3 py-2 hover:bg-gray-100 disabled:opacity-60"
        >
          {resettingOnboarding ? "Resetting..." : "Redo Onboarding"}
        </button>
      </div>

      <div className="border rounded-2xl p-6 space-y-2">
        <p className="text-sm opacity-80">
          Recommendations screen comes next.
        </p>
        <p className="text-sm opacity-70">
          Current signals: {signalSummary.totalSignals} /{" "}
          {signalSummary.minimumSignals}
        </p>
      </div>
    </div>
  );
}

export default ForYouPage;