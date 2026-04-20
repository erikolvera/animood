import { Link } from "react-router-dom";

function OnboardingIntro({
  profileFavorites = [],
  totalSignals = 0,
  onContinue,
  onSkip,
}) {
  return (
    <div>
      <h1>Let’s personalize your recommendations</h1>

      {totalSignals > 0 && (
        <p>We found some existing preference data.</p>
      )}

      {profileFavorites.length > 0 && (
        <div>
          {profileFavorites.map((anime) => (
            <div key={anime.mal_id}>
              <p>{anime.title_english || anime.title}</p>
            </div>
          ))}
          <Link to="/profile">Edit favorites in profile</Link>
        </div>
      )}

      <button onClick={onContinue}>Continue</button>
      <button onClick={onSkip}>Skip for now</button>
    </div>
  );
}

export default OnboardingIntro;