import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import OnboardingIntro from "../components/foryou/OnboardingIntro";
import { getForYouSignalSummary } from "../services/onboardingService";

function ForYouPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState("intro");
  const [signalSummary, setSignalSummary] = useState({
    totalSignals: 0,
    hasEnoughData: false,
    profileFavorites: [],
    counts: {},
  });

  useEffect(() => {
    async function loadPage() {
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
      } catch (err) {
        console.error(err);
        setError("Failed to load For You page");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, []);

  function handleContinue() {
    setOnboardingStep("genres");
  }

  function handleSkip() {
    setShowOnboarding(false);
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">{error}</div>;

  if (showOnboarding && onboardingStep === "intro") {
    return (
      <div className="p-4">
        <OnboardingIntro
          profileFavorites={signalSummary.profileFavorites}
          totalSignals={signalSummary.totalSignals}
          onContinue={handleContinue}
          onSkip={handleSkip}
        />
      </div>
    );
  }

  return <div className="p-4">Recommendations screen comes next.</div>;
}

export default ForYouPage;