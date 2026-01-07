
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

  // Added a more explicit prompt and used both Maps and Search for better results.
  const prompt = `Você é um especialista em rotas e geografia. 
  Calcule a distância e o tempo de viagem entre a origem: "${info.origin}" e o destino: "${info.destination}".
  
  REGRAS:
  1. Forneça a distância exata ou estimada em quilômetros.
  2. Informe o tempo médio de viagem (carro, ônibus, etc).
  3. Descreva brevemente a principal rodovia ou rota.
  4. Responda obrigatoriamente em Português do Brasil.
  5. Se não encontrar dados exatos, forneça uma estimativa baseada em seu conhecimento geográfico.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // Using both tools as allowed by the guidelines for Maps grounding.
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: toolConfig,
        temperature: 0.7,
      },
    });

    // Check all parts for text if the getter fails
    let text = response.text;
    if (!text && response.candidates?.[0]?.content?.parts) {
      text = response.candidates[0].content.parts
        .map(part => part.text)
        .filter(t => t)
        .join("\n");
    }

    if (!text) {
      text = "Não foi possível gerar um resumo textual, mas verifique as fontes abaixo para mais detalhes no mapa.";
    }
    
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps) {
          sources.push({
            title: chunk.maps.title || "Localização no Google Maps",
            uri: chunk.maps.uri
          });
        } else if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Fonte Web",
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    const errorMessage = error?.message || "";
    
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      throw new Error("O modelo de IA não foi encontrado. Por favor, tente novamente mais tarde.");
    }
    
    throw new Error("Erro ao calcular a distância. Verifique sua conexão ou tente outros nomes de cidades.");
  }
};
