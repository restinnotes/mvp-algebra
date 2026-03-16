import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define the schema for the output to ensure Gemini returns exactly what we need
const responseSchema = {
    description: "Scaffolding steps for a math problem",
    type: SchemaType.OBJECT,
    properties: {
        problemStatement: {
            type: SchemaType.STRING,
            description: "The full text of the math problem identified from the image"
        },
        steps: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.NUMBER },
                    label: { type: SchemaType.STRING, description: "Short title for the step like 'Discriminant Condition'" },
                    expression: { type: SchemaType.STRING, description: "The LaTeX target for this step like '\\Delta = b^2 - 4ac'" },
                    expectedResult: { type: SchemaType.STRING, description: "The final value or expression expected for this step" },
                    knowledgeTag: { type: SchemaType.STRING, description: "The ID of the knowledge point like 'kp_001'" },
                    hint: { type: SchemaType.STRING, description: "A helpful hint if the student gets stuck" }
                },
                required: ["id", "label", "expression", "expectedResult", "knowledgeTag", "hint"]
            }
        }
    },
    required: ["problemStatement", "steps"]
};

export async function POST(req: NextRequest) {
    try {
        const { imageBase64 } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Use Gemini 3.1 Pro for the strongest reasoning (Decomposition)
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-pro",
            generationConfig: {
                responseMimeType: "application/json",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                responseSchema: responseSchema as any,
            },
        });

        const base64Data = imageBase64.split(',')[1] || imageBase64;

        const prompt = `
      You are a professional math tutor and expert in the Chinese middle school math curriculum.
      Your task is to "Shadow Solve" the math problem in the provided image and decompose it into a "Dynamic Scaffolding" tasks for a student.
      
      RULES:
      1. Correctness First: Solve the problem perfectly yourself before decomposing.
      2. Scaffolding Pattern: Break the problem into 3-5 logical steps. Do not give the answer immediately.
      3. Knowledge Mapping: Refer to the following Knowledge Points (KP) and tag each step with the most relevant one:
         - kp_001: Discriminant Condition (Δ ≥ 0)
         - kp_002: Vieta's Theorem (Sum and Product x1+x2=-b/a, x1x2=c/a)
         - kp_003: Symmetric form transformation (Perfect square)
         - kp_004: Fraction/Rational expression transformation (1/x1 + 1/x2)
         - kp_005: Global root verification (Plugging back to discriminant)
      4. LaTeX: Use standard LaTeX for expressions.
      5. Expected Result: The 'expectedResult' should be a simplified string that the student is likely to write at the end of that step.
      
      Output the result in the specified JSON format.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png"
                }
            }
        ]);

        const response = await result.response;
        const jsonStr = response.text();
        const data = JSON.parse(jsonStr);

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Decomposition Error:', error);
        return NextResponse.json({
            error: 'Failed to decompose problem',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
