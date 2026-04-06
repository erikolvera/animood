const genres = [
  { id: 1, name: "Action" },
  { id: 2, name: "Adventure" },
  { id: 4, name: "Comedy" },
  { id: 8, name: "Drama" },
  { id: 10, name: "Fantasy" },
  { id: 14, name: "Horror" },
  { id: 22, name: "Romance" },
  { id: 24, name: "Sci-Fi" },
  { id: 36, name: "Slice of Life" },
  { id: 37, name: "Supernatural" },
];

function GenreFilterBar({ selectedGenre, onGenreSelect }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-stone-800 mb-3">Browse by Genre</h2>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onGenreSelect("")}
          className={`px-3 py-1 rounded-full border ${
            selectedGenre === "" ? "font-bold" : ""
          }`}
        >
          All
        </button>

        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onGenreSelect(genre.id)}
            className={`px-3 py-1 rounded-full border ${
              String(selectedGenre) === String(genre.id) ? "font-bold" : ""
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExploreControls({ selectedGenre, onGenreSelect }) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <GenreFilterBar
        selectedGenre={selectedGenre}
        onGenreSelect={onGenreSelect}
      />
    </div>
  );
}

export default ExploreControls;