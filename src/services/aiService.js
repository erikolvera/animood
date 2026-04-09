import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// async function main() {
//   const response = await ai.models.generateContent({
//     model: "gemini-3-flash-preview",
//     contents: "Explain how AI works in a few words",
//   });
//   console.log(response.text);
// }

// main();

export async function getGenresFromMood(userPrompt) {
    const prompt = `
    You are an anime recommendation system. A user will describe their mood or what they want to watch.
    Your job is to map their request to the closest corresponding Jikan API genre IDs.
    
    Valid Jikan Genre IDs:
    Action = 1, Adventure = 2, Comedy = 4, Drama = 8, Fantasy = 10, 
    Horror = 14, Romance = 22, Sci-Fi = 24, Slice of Life = 36, Supernatural = 37
    
    User Request: "${userPrompt}"
    
    You MUST respond with only a JSON object in this format, and absolutely nothing else. Do not use markdown backticks:
    {"genres": [id1, id2]}
  `;

    try {
        const response = await ai.models.generateContent({

            model: "gemini-3-flash-preview",
            contents: prompt
        });

        const responseText = response.text;
        const parsedData = JSON.parse(responseText.trim());

        return parsedData.genres;
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error("Failed to interpret your mood")
    }
}