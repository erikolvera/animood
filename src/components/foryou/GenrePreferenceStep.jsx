import { useState } from "react";

const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
];

function GenrePreferenceStep({
  initialLikedGenres = [],
  initialDislikedGenres = [],
  onSave,
  onBack,
  onSkip,
  saving = false,
}) {
  const [likedGenres, setLikedGenres] = useState(initialLikedGenres);
  const [dislikedGenres, setDislikedGenres] = useState(initialDislikedGenres);

  function toggleLikedGenre(genre) {
    setLikedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );

    setDislikedGenres((prev) => prev.filter((g) => g !== genre));
  }

  function toggleDislikedGenre(genre) {
    setDislikedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );

    setLikedGenres((prev) => prev.filter((g) => g !== genre));
  }

  function handleSave() {
    onSave({
      likedGenres,
      dislikedGenres,
    });
  }

  return (
    <div className="border rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Pick genres you like</h2>
        <p className="text-sm opacity-80">
          Choose a few genres you enjoy, and optionally mark genres you’re less
          interested in.
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Liked genres</h3>
        <div className="flex flex-wrap gap-3">
          {GENRES.map((genre) => {
            const isSelected = likedGenres.includes(genre);

            return (
              <button
                key={`like-${genre}`}
                type="button"
                onClick={() => toggleLikedGenre(genre)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  isSelected
                    ? "bg-green-100 border-green-400"
                    : "hover:bg-gray-100"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Disliked genres</h3>
        <div className="flex flex-wrap gap-3">
          {GENRES.map((genre) => {
            const isSelected = dislikedGenres.includes(genre);

            return (
              <button
                key={`dislike-${genre}`}
                type="button"
                onClick={() => toggleDislikedGenre(genre)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  isSelected
                    ? "bg-red-100 border-red-400"
                    : "hover:bg-gray-100"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="border rounded px-4 py-2 hover:bg-gray-100"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="border rounded px-4 py-2 hover:bg-gray-100 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save and Continue"}
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
  );
}

export default GenrePreferenceStep;