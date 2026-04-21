import { Link } from "react-router-dom";

function OnboardingIntro({
  profileFavorites = [],
  totalSignals = 0,
  onContinue,
  onSkip,
}) {
  return (
    <div className="space-y-6">
      <div className="border rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">
          Let’s personalize your recommendations
        </h1>

        <p className="text-sm opacity-80">
          We’ll use your favorites and a few quick preferences to build better
          recommendations for you.
        </p>

        {totalSignals > 0 && (
          <p className="text-sm mt-2 opacity-70">
            We found some existing preference data, but a little more will help
            us improve your results.
          </p>
        )}
      </div>

      {profileFavorites.length > 0 && (
        <div className="border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-3">
            We found favorites on your profile
          </h2>

          <p className="text-sm opacity-80 mb-4">
            We’ll use these as part of your recommendation profile.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {profileFavorites.map((anime) => (
              <div key={anime.mal_id} className="flex flex-col gap-2">
                <div className="rounded-xl overflow-hidden border aspect-[3/4]">
                  {anime.image_url ? (
                    <img
                      src={anime.image_url}
                      alt={anime.title_english || anime.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs opacity-60">
                      No Image
                    </div>
                  )}
                </div>

                <p className="text-sm font-medium line-clamp-2">
                  {anime.title_english || anime.title}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Link to="/profile" className="text-sm underline">
              Edit favorites in profile
            </Link>
          </div>
        </div>
      )}

      <div className="border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-2">Ready to continue?</h2>
        <p className="text-sm opacity-80 mb-4">
          Next, we’ll ask for a few quick preferences to improve your starter
          recommendations.
        </p>

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={onContinue}
            className="border rounded px-4 py-2 hover:bg-gray-100"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="border rounded px-4 py-2 hover:bg-gray-100"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingIntro;