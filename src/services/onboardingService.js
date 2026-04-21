import { supabase } from "../supabaseClient";
import { upsertAnimeCache } from "./animeCacheService";

const MINIMUM_SIGNALS = 20;

export async function getProfileFavorites(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("favorite_animes")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data?.favorite_animes || [];
}

export async function getForYouSignalSummary(userId) {
  const [
    profileResult,
    ratingsResult,
    interactionsResult,
    onboardingResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("favorite_animes")
      .eq("id", userId)
      .maybeSingle(),

    supabase
      .from("anime_ratings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("user_anime_interactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("user_onboarding_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (ratingsResult.error) throw ratingsResult.error;
  if (interactionsResult.error) throw interactionsResult.error;
  if (onboardingResult.error) throw onboardingResult.error;

  const profileFavorites = profileResult.data?.favorite_animes || [];

  const totalSignals =
    profileFavorites.length +
    (ratingsResult.count || 0) +
    (interactionsResult.count || 0) +
    (onboardingResult.count || 0);

  return {
    hasEnoughData: totalSignals >= MINIMUM_SIGNALS,
    totalSignals,
    minimumSignals: MINIMUM_SIGNALS,
    profileFavorites,
    counts: {
      profileFavorites: profileFavorites.length,
      animeRatings: ratingsResult.count || 0,
      interactions: interactionsResult.count || 0,
      onboardingResponses: onboardingResult.count || 0,
    },
  };
}

export async function getOnboardingCandidates(userId, limit = 6) {
  const [
    profileResult,
    ratingsResult,
    interactionsResult,
    onboardingResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("favorite_animes")
      .eq("id", userId)
      .maybeSingle(),

    supabase
      .from("anime_ratings")
      .select("anime_id")
      .eq("user_id", userId),

    supabase
      .from("user_anime_interactions")
      .select("mal_id")
      .eq("user_id", userId),

    supabase
      .from("user_onboarding_responses")
      .select("mal_id")
      .eq("user_id", userId),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (ratingsResult.error) throw ratingsResult.error;
  if (interactionsResult.error) throw interactionsResult.error;
  if (onboardingResult.error) throw onboardingResult.error;

  const excludedIds = new Set([
    ...(profileResult.data?.favorite_animes || []).map((a) => a.mal_id),
    ...(ratingsResult.data || []).map((a) => a.anime_id),
    ...(interactionsResult.data || []).map((a) => a.mal_id),
    ...(onboardingResult.data || []).map((a) => a.mal_id),
  ]);

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
      genres
    `)
    .order("members", { ascending: false })
    .limit(100);

  if (error) throw error;

  const filtered = (data || []).filter(
    (anime) => !excludedIds.has(anime.mal_id)
  );

  return filtered.slice(0, limit);
}

export async function saveOnboardingResponse(userId, anime, response) {
  if (!anime?.mal_id) throw new Error("Missing anime mal_id");

  if (!["like", "unsure", "dislike"].includes(response)) {
    throw new Error("Invalid onboarding response");
  }

  const normalizedAnime = {
    mal_id: anime.mal_id,
    title: anime.title || "",
    title_english: anime.title_english || null,
    synopsis: anime.synopsis || null,
    image_url:
      anime.image_url ||
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      anime.images?.webp?.large_image_url ||
      anime.images?.webp?.image_url ||
      null,
    type: anime.type || null,
    episodes: anime.episodes || null,
    score: anime.score || null,
    popularity: anime.popularity || null,
    members: anime.members || null,
    year: anime.year || null,
    season: anime.season || null,
    genres: Array.isArray(anime.genres)
      ? anime.genres.map((g) => (typeof g === "string" ? g : g.name))
      : [],
  };

  await upsertAnimeCache([normalizedAnime]);

  const { data, error } = await supabase
    .from("user_onboarding_responses")
    .upsert(
      [
        {
          user_id: userId,
          mal_id: anime.mal_id,
          response,
        },
      ],
      { onConflict: "user_id, mal_id" }
    )
    .select();

  if (error) throw error;
  return data || [];
}

export async function resetOnboardingData(userId) {
  const { error } = await supabase
    .from("user_onboarding_responses")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;

  return true;
}