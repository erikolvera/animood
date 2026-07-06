// Thin client wrapper around /api/moodbot. The Gemini call itself runs
// server-side (src/app/api/moodbot/route.ts) so the API key never ships
// to the browser.
export async function getGenresFromMood(userPrompt: string): Promise<{
  friendly_message: string;
  genres: number[];
}> {
  const res = await fetch("/api/moodbot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: userPrompt }),
  });

  if (!res.ok) {
    throw new Error("Failed to interpret your mood");
  }

  return res.json();
}
