import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getExplanation = async (partName: string, context: string): Promise<string> => {
  if (!apiKey) return "Clé API manquante. Impossible de générer l'explication.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tu es un professeur expert en génie mécanique.
      Explique de manière pédagogique, simple et concise (max 3 phrases) le rôle cinématique de la classe d'équivalence "${partName}" dans un système "${context}".
      Insiste sur ses mouvements possibles par rapport aux autres pièces.`,
    });
    return response.text || "Pas de réponse disponible.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Désolé, une erreur est survenue lors de la génération de l'explication.";
  }
};

export const generateLessonImage = async (topic: string): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    // Utilisation de Imagen 3.0 pour une meilleure compatibilité et éviter l'erreur 403
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: `Create a simple, educational, 3D rendered style illustration of a mechanical engineering concept: ${topic}. 
            Clean background, bright colors, technical diagram style but artistic.`,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
        outputMimeType: "image/png"
      }
    });

    const base64Data = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64Data) {
      return `data:image/png;base64,${base64Data}`;
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const getQuizQuestion = async (level: string): Promise<{ question: string; options: string[]; answer: string; explanation: string }> => {
    if (!apiKey) return {
        question: "API Key missing",
        options: [],
        answer: "",
        explanation: ""
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Génère une question à choix multiple (QCM) sur les classes d'équivalence cinématique en mécanique.
            Niveau: ${level}.
            Évite les questions trop spécifiques au modèle 3D actuel, pose des questions de théorie générale sur les liaisons, les mouvements (translation, rotation) et l'isostatisme.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { 
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        answer: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    propertyOrdering: ["question", "options", "answer", "explanation"]
                }
            }
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (e) {
        console.error(e);
        return {
             question: "Erreur de génération",
             options: ["Erreur"],
             answer: "Erreur",
             explanation: "Veuillez vérifier la clé API."
        };
    }
}