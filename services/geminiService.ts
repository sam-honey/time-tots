import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateTimeQuestion = async (): Promise<QuizQuestion | null> => {
  try {
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        questionText: {
          type: Type.STRING,
          description: "A friendly question asking a child to set the clock to a specific time. e.g. 'Can you set the clock to half past three?'",
        },
        targetHour: {
          type: Type.INTEGER,
          description: "The target hour (0-23) corresponding to the question.",
        },
        targetMinute: {
          type: Type.INTEGER,
          description: "The target minute (0-59) corresponding to the question.",
        },
        hint: {
          type: Type.STRING,
          description: "A helpful hint if they get stuck. e.g. 'The little hand should be on the 3 and the big hand on the 6.'",
        }
      },
      required: ["questionText", "targetHour", "targetMinute", "hint"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a simple time-telling challenge for a 5-year-old child. Vary between 'o'clock', 'half past', 'quarter past', and specific minutes like 'ten past'. Ensure hours are logical for a child's day (e.g., wake up, lunch, bedtime).",
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as QuizQuestion;
  } catch (error) {
    console.error("Failed to generate quiz question:", error);
    // Fallback question if API fails
    return {
      questionText: "Can you set the clock to 12:00?",
      targetHour: 12,
      targetMinute: 0,
      hint: "Both hands point up!"
    };
  }
};

export const checkAnswer = async (currentHour: number, currentMinute: number, targetHour: number, targetMinute: number): Promise<string> => {
    // Simple logic check can be done locally, but let's ask Gemini for a encouraging message based on how close they are.
    try {
        const diffMinutes = Math.abs((currentHour * 60 + currentMinute) - (targetHour * 60 + targetMinute));
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The child was asked to set the clock to ${targetHour}:${targetMinute}. They set it to ${currentHour}:${currentMinute}. The difference is ${diffMinutes} minutes. Give a very short, encouraging 1-sentence response. If they are correct (within 2 minutes), say 'Great job!'. If they are close, encourage them. If far off, give a gentle hint.`,
        });

        return response.text || "Good try!";
    } catch (e) {
        return "Nice try!";
    }
}