import { supabase } from "../supabaseClient";
import { getForYouSignalSummary } from "./onboardingService";

const MINIMUM_SIGNALS = 20;

export async function getRecommendations(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const inputs = await getRecommendationInputs(userId);
  const excludedIds = buildExcludedIds(inputs);

  return {
    recommendations: [],
    hasEnoughData: inputs.totalSignals >= MINIMUM_SIGNALS,
    mode: inputs.totalSignals >= MINIMUM_SIGNALS ? "personalized" : "fallback",
    debug: {
      totalSignals: inputs.totalSignals,
      excludedCount: excludedIds.size,
      counts: inputs.counts,
    },
  };
}

export async function getRecommendationInputs(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const [
    signalSummary,
    ratingsResult,
    interactionsResult,
    genrePreferencesResult,
    onboardingResponsesResult,
  ] = await Promise.all([
    getForYouSignalSummary(userId),

    supabase
      .from("anime_ratings")
      .select("anime_id, rating")
      .eq("user_id", userId),

    supabase
      .from("user_anime_interactions")
      .select("mal_id, rating, liked, disliked, is_favorite, watch_status")
      .eq("user_id", userId),

    supabase
      .from("user_genre_preferences")
      .select("genre_name, preference_type")
      .eq("user_id", userId),

    supabase
      .from("user_onboarding_responses")
      .select("mal_id, response")
      .eq("user_id", userId),
  ]);

  if (ratingsResult.error) throw ratingsResult.error;
  if (interactionsResult.error) throw interactionsResult.error;
  if (genrePreferencesResult.error) throw genrePreferencesResult.error;
  if (onboardingResponsesResult.error) throw onboardingResponsesResult.error;

  const animeRatings = ratingsResult.data || [];
  const interactions = interactionsResult.data || [];
  const genrePreferences = genrePreferencesResult.data || [];
  const onboardingResponses = onboardingResponsesResult.data || [];

  const likedGenres = genrePreferences
    .filter((item) => item.preference_type === "like")
    .map((item) => item.genre_name);

  const dislikedGenres = genrePreferences
    .filter((item) => item.preference_type === "dislike")
    .map((item) => item.genre_name);

  const likedOnboardingIds = onboardingResponses
    .filter((item) => item.response === "like")
    .map((item) => item.mal_id);

  const dislikedOnboardingIds = onboardingResponses
    .filter((item) => item.response === "dislike")
    .map((item) => item.mal_id);

  const unsureOnboardingIds = onboardingResponses
    .filter((item) => item.response === "unsure")
    .map((item) => item.mal_id);

  return {
    userId,
    totalSignals: signalSummary.totalSignals || 0,
    hasEnoughData: signalSummary.hasEnoughData || false,
    minimumSignals: signalSummary.minimumSignals || MINIMUM_SIGNALS,

    profileFavorites: signalSummary.profileFavorites || [],
    animeRatings,
    interactions,
    genrePreferences,
    onboardingResponses,

    likedGenres,
    dislikedGenres,
    likedOnboardingIds,
    dislikedOnboardingIds,
    unsureOnboardingIds,

    counts: {
      profileFavorites: signalSummary.profileFavorites?.length || 0,
      animeRatings: animeRatings.length,
      interactions: interactions.length,
      genrePreferences: genrePreferences.length,
      onboardingResponses: onboardingResponses.length,
    },
  };
}

export function buildExcludedIds(inputs) {
  const excludedIds = new Set();

  for (const anime of inputs.profileFavorites || []) {
    if (anime?.mal_id != null) {
      excludedIds.add(Number(anime.mal_id));
    }
  }

  for (const rating of inputs.animeRatings || []) {
    if (rating?.anime_id != null) {
      excludedIds.add(Number(rating.anime_id));
    }
  }

  for (const interaction of inputs.interactions || []) {
    if (interaction?.mal_id != null) {
      excludedIds.add(Number(interaction.mal_id));
    }
  }

  for (const response of inputs.onboardingResponses || []) {
    if (response?.mal_id == null) continue;

    if (response.response === "dislike") {
      excludedIds.add(Number(response.mal_id));
    }
  }

  return excludedIds;
}

export async function loadCandidatePool(excludedIds, limit = 300) {
  const fetchLimit = Math.max(limit * 3, 100);

  const { data, error } = await supabase
    .from("anime_cache")
    .select(`
      mal_id,
      title,
      title_english,
      synopsis,
      image_url,
      type,
      episodes,
      score,
      popularity,
      members,
      year,
      season,
      genres,
      themes,
      demographics,
      studios
    `)
    .not("image_url", "is", null)
    .order("members", { ascending: false })
    .limit(fetchLimit);

  if (error) {
    throw error;
  }

  const filtered = (data || []).filter((anime) => {
    if (!anime?.mal_id) return false;
    if (excludedIds.has(Number(anime.mal_id))) return false;
    return true;
  });

  return filtered.slice(0, limit);
}