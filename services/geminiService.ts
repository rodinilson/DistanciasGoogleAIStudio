
import { GoogleGenAI } from "@google/genai";
import { LocationInfo, CalculationResult, GroundingSource } from "../types";

export const calculateDistance = async (
  info: LocationInfo,
  userLocation: { lat: number | null; lng: number | null }
): Promise<CalculationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const toolConfig = userLocation.lat && userLocation.lng ? {
    retrievalConfig: {
      latLng: {
        latitude: userLocation.lat,
        longitude: userLocation.lng
      }
    }
  } : undefined;

  // Prompt strict for the requested format
  const prompt = `Calcule a distância rodoviária entre "${info.origin}" e "${info.destination}".
  Sua resposta deve ser EXTREMAMENTE concisa.
  FORMATO OBRIGATÓRIO: "Total KM: [número]"
  Não escreva mais nada além disso. Não adicione explicações.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: toolConfig,
        temperature: 0, // Zero temperature for maximum precision and conciseness
      },
    });

    let text = "";
    if (response.candidates?.[0]?.content?.parts) {
      text = response.candidates[0].content.parts
        .map(part => part.text || "")
        .join("")
        .trim();
    }

    // Attempt to clean up in case the model ignored instructions and added more text
    const match = text.match(/Total KM:\s*(\d+([.,]\d+)?)/i);
    if (match) {
      text = match[0];
    } else if (!text || text.length === 0) {
      text = "Não foi possível calcular a distância exata.";
    }
    
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps) {
          sources.push({
            title: chunk.maps.title || "Localização no Maps",
            uri: chunk.maps.uri
          });
        }
      });
    }

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("Erro ao consultar a rota. Tente novamente.");
  }
};
