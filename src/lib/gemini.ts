import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Schema } from "@google/generative-ai";

type SchemaLike = Record<string, unknown> & {};

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.warn("[gemini] GEMINI_API_KEY not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

const MODELS = {
  // 核心推理与算力角色
  reasoning: "gemini-3.1-flash-lite-preview",
  
  // 记忆与画像分析角色
  persona: "gemini-3.1-flash-lite-preview",
  
  // OCR 与视觉理解角色
  ocr: "gemini-3.1-flash-lite-preview",
  
  // 通用/快速响应角色
  fast: "gemini-3.1-flash-lite-preview",
} as const;

export type ModelTier = keyof typeof MODELS;

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 3000;

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const is429 = err instanceof Error && (
        err.message.includes('429') || err.message.includes('Too Many Requests') || err.message.includes('quota')
      );
      if (!is429 || attempt === MAX_RETRIES) throw err;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`[gemini] Rate limited, retrying in ${Math.round(delay)}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}

export async function generateJSON<T>(
  prompt: string,
  schema: SchemaLike,
  tier: ModelTier = "reasoning"
): Promise<T> {
  return withRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: MODELS[tier],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as unknown as Schema,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      return JSON.parse(text) as T;
    } catch {
      const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();
      return JSON.parse(cleaned) as T;
    }
  });
}

export async function generateText(
  prompt: string,
  tier: ModelTier = "fast"
): Promise<string> {
  return withRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: MODELS[tier],
    });

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  });
}

export async function generateFromImage<T>(
  prompt: string,
  imageBase64: string,
  schema: SchemaLike,
  mimeType: string = "image/png"
): Promise<T> {
  return withRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: MODELS.reasoning,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as unknown as Schema,
      },
    });

    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data!,
          mimeType,
        },
      },
    ]);

    const text = result.response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();
      return JSON.parse(cleaned) as T;
    }
  });
}

export { SchemaType };
