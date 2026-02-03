import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcribes audio context using Gemini 3 Flash.
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: audioBlob.type,
                  data: base64Audio
                }
              },
              {
                text: "Transcribe this audio note from a parent describing their child's behavior. Return only the text."
              }
            ]
          }
        });
        
        resolve(response.text || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
};

/**
 * Analyzes image or video using Gemini 3 Pro with Thinking Mode.
 */
export const analyzeDevelopment = async (
  mediaFile: File, 
  age: string, 
  contextNotes: string
): Promise<AnalysisResult> => {
  
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64Media = (reader.result as string).split(',')[1];
        const mimeType = mediaFile.type;
        
        // Define the schema for the JSON response
        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING, description: "A short, cheerful summary (e.g., 'Walking like a pro!')" },
            motorSkills: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING, description: "Short status (e.g., 'On Track')" },
                description: { type: Type.STRING, description: "Detailed observation of posture, movement, etc." },
                score: { type: Type.NUMBER, description: "A heuristic score 0-100 of motor development for the age" }
              }
            },
            physicalGrowth: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING },
                description: { type: Type.STRING, description: "Observation on physical proportions relative to age norms" }
              }
            },
            activity: {
              type: Type.OBJECT,
              properties: {
                pattern: { type: Type.STRING },
                description: { type: Type.STRING, description: "Engagement and focus levels" }
              }
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 actionable, simple tips for parents"
            },
            reassurance: { type: Type.STRING, description: "A warm, non-medical closing statement." }
          },
          required: ["headline", "motorSkills", "physicalGrowth", "activity", "tips", "reassurance"]
        };

        const prompt = `
          You are a friendly, expert child development specialist. 
          Analyze this ${mimeType.startsWith('video') ? 'video' : 'image'} of a child.
          
          Context provided by parent:
          - Child's Age: ${age}
          - Parent's Notes: ${contextNotes}
          
          Your task:
          1. Analyze motor skills (posture, gait, coordination), physical proportions, and activity patterns.
          2. Compare these observations against standard WHO developmental milestones for a child of this age.
          3. Use the Google Search tool to verify specific recent developmental guidelines if needed.
          4. Provide a reassuring, non-medical report card. Avoid technical jargon. Be warm and encouraging.
          5. If the child seems significantly behind, gently suggest consulting a pediatrician without being alarmist.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Media
                }
              },
              { text: prompt }
            ]
          },
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            thinkingConfig: {
              thinkingBudget: 32768, // Max thinking budget for deep analysis
            }
          }
        });

        const resultJson = JSON.parse(response.text || "{}");
        
        // Extract grounding metadata if available
        const groundingUrls: string[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
              groundingUrls.push(chunk.web.uri);
            }
          });
        }

        resolve({ ...resultJson, groundingUrls });

      } catch (e) {
        console.error("Analysis failed", e);
        reject(e);
      }
    };
    reader.readAsDataURL(mediaFile);
  });
};
