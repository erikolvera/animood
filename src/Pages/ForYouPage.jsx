import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import OnboardingIntro from "../components/foryou/OnboardingIntro";
import { getForYouSignalSummary, resetOnboardingData } from "../services/onboardingService";

function ForYouPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState("intro");
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  const [signalSummary, setSignalSummary] = useState({
    totalSignals: 0,
    hasEnoughData: false,
    minimumSignals: 15,
    profileFavorites: [],
    counts: {
      favorites: 0,
      likedGenres: 0,
      dislikedGenres: 0,
      reactions: 0,
    },
  });

  const loadForYouPage = useCallback(async () => {
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
    } catch (err) {
      console.error(err);
      setError("Failed to load For You page");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForYouPage();
  }, [loadForYouPage]);

  function handleOnboardingContinue() {
    setOnboardingStep("genres");
  }

  function handleOnboardingSkip() {
    setShowOnboarding(false);
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
          onClick={loadForYouPage}
          className="border rounded px-3 py-2 hover:bg-gray-100"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (showOnboarding && onboardingStep === "intro") {
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

        <OnboardingIntro
          profileFavorites={signalSummary.profileFavorites}
          totalSignals={signalSummary.totalSignals}
          minimumSignals={signalSummary.minimumSignals}
          onContinue={handleOnboardingContinue}
          onSkip={handleOnboardingSkip}
        />
      </div>
    );
  }

  if (showOnboarding && onboardingStep === "genres") {
    return (
      <div className="p-4 max-w-6xl mx-auto space-y-4">
        <div className="border rounded-2xl p-6">
          <h1 className="text-xl font-bold mb-2">Genre step coming next</h1>
        </div>
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