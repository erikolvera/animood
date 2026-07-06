import { GoogleGenAI } from "@google/genai";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GEMINI_API_KEY has no NEXT_PUBLIC_ prefix, so it only exists server-side.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MAX_PROMPT_LENGTH = 500;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let prompt: unknown;
  try {
    ({ prompt } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof prompt !== "string" ||
    !prompt.trim() ||
    prompt.length > MAX_PROMPT_LENGTH
  ) {
    return NextResponse.json(
      { error: `prompt must be a non-empty string of at most ${MAX_PROMPT_LENGTH} characters` },
      { status: 400 }
    );
  }

  const fullPrompt = `
    You are an empathetic, friendly anime recommendation bot.
    A user will describe their mood. Your job is to:
    1. Acknowledge their feeling in a short, friendly, and natural sentence.
    2. Map their request to 1 or 2 Jikan API genre IDs.

    Valid Jikan Genre IDs:
    Action = 1, Adventure = 2, Comedy = 4, Drama = 8, Fantasy = 10,
    Horror = 14, Romance = 22, Sci-Fi = 24, Slice of Life = 36, Supernatural = 37

    User Request: "${prompt}"

    You MUST respond with only a JSON object in this format, and absolutely nothing else. Do not use markdown backticks:
    {
       "friendly_message": "Oh no, I'm sorry you're feeling down! A good laugh always helps me feel better.",
       "genres": [id1, id2]
    }
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
    });

    const parsedData = JSON.parse((response.text ?? "").trim());
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to interpret your mood" },
      { status: 502 }
    );
  }
}
