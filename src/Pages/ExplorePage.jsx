import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ExploreControls from "../components/explore/ExploreControls";
import AnimeSection from "../components/explore/AnimeSection";

function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const genre = searchParams.get("genre") || "";

  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("default");

  useEffect(() => {
    async function fetchExploreAnime() {
      try {
        setLoading(true);
        setError("");

        let url = "https://api.jikan.moe/v4/top/anime";

        if (genre) {
          url = `https://api.jikan.moe/v4/anime?genres=${genre}&order_by=score&sort=desc`;
          setMode("genre");
        } else {
          setMode("default");
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch anime.");
        }

        const data = await response.json();
        setAnimeList(data.data || []);
      } catch (err) {
        setError(err.message);
        setAnimeList([]);
      } finally {
        setLoading(false);
      }
    }

    fetchExploreAnime();
  }, [genre]);

  function handleGenreSelect(genreId) {
    if (!genreId) {
      setSearchParams({});
      return;
    }

    setSearchParams({ genre: String(genreId) });
  }

  const genreNames = {
  "1": "Action",
  "2": "Adventure",
  "4": "Comedy",
  "8": "Drama",
  "10": "Fantasy",
  "14": "Horror",
  "22": "Romance",
  "24": "Sci-Fi",
  "36": "Slice of Life",
  "37": "Supernatural",
  };

  function ExploreStatus({ mode, selectedGenre, resultCount }) {
    let text = "Trending anime";

    if (mode === "genre" && selectedGenre) {
      text = `Browsing genre: ${genreNames[selectedGenre] || "Unknown Genre"}`;
    }

    return (
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-800">{text}</h1>
        <p className="text-stone-500 mt-1">{resultCount} result(s)</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8">
      <ExploreControls
        selectedGenre={genre}
        onGenreSelect={handleGenreSelect}
      />

      <ExploreStatus mode={mode} selectedGenre={genre} resultCount={animeList.length} />

      <AnimeSection
        loading={loading}
        error={error}
        animeList={animeList}
      />
    </div>
  );
}

export default ExplorePage;