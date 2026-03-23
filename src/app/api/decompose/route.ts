import { NextRequest, NextResponse } from 'next/server';
import { SchemaType } from "@google/generative-ai";
import { generateFromImage } from '@/lib/gemini';
import { parseSafeJson } from '@/lib/api-utils';

const responseSchema = {
    description: "Scaffolding steps for a math problem",
    // ... (rest of schema)
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
} as const;

export async function POST(req: NextRequest) {
    try {
        const { imageBase64 } = await parseSafeJson(req, 4.5 * 1024 * 1024);

        if (!imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        if (typeof imageBase64 !== 'string') {
            return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
        }

        // Limit base64 length to ~5MB to prevent memory exhaustion (DoS)
        if (imageBase64.length > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'Image payload too large' }, { status: 413 });
        }

        const prompt = `
          You are a professional math tutor and expert in the Chinese middle school math curriculum.
          Your task is to "Shadow Solve" the math problem in the provided image and decompose it into a "Dynamic Scaffolding" tasks for a student.
          
          RULES:
          1. Correctness First: Solve the problem perfectly yourself before decomposing.
          2. Scaffolding Pattern: Break the problem into 3-5 logical steps. Do not give the answer immediately.
          3. Knowledge Mapping: Refer to the following Knowledge Points (KP) and tag each step with the most relevant one...
          4. LaTeX: Use standard LaTeX for expressions.
          5. Expected Result: The 'expectedResult' should be a simplified string that the student is likely to write at the end of that step.
          
          Output the result in the specified JSON format.
        `;

        const data = await generateFromImage(prompt, imageBase64, responseSchema);

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Decomposition Error:', error);
        return NextResponse.json({
            error: 'Failed to decompose problem',
            details: 'An internal error occurred'
        }, { status: 500 });
    }
}
