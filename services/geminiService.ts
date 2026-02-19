import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMovieRecommendation = async (
  userQuery: string, 
  currentContext: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Service Unavailable (Missing Key)";

  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      You are CineFlow AI, a sophisticated movie concierge for a premium streaming platform.
      The user is asking: "${userQuery}".
      Current context/movie being viewed: "${currentContext}".
      
      Provide a short, witty, and insightful recommendation or answer (under 100 words).
      Focus on mood, cinematography, and "vibe".
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "I couldn't generate a recommendation at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the cinematic neural network right now.";
  }
};

export const getSmartSynopsis = async (movieTitle: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Synopsis unavailable.";

  try {
     const model = "gemini-3-flash-preview";
     const prompt = `Write a gripping, one-sentence "logline" style synopsis for the movie "${movieTitle}" that emphasizes its atmosphere.`;
     
     const response = await ai.models.generateContent({
       model,
       contents: prompt
     });
     
     return response.text || "Synopsis unavailable.";
  } catch (e) {
    return "Synopsis currently offline.";
  }
}
