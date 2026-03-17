import { NextRequest, NextResponse } from 'next/server';
import { SchemaType } from "@google/generative-ai";
import { generateFromImage } from '@/lib/gemini';

const ocrSchema = {
    type: SchemaType.OBJECT,
    properties: {
        latex: { type: SchemaType.STRING, description: "the recognized latex or text" },
        isCorrect: { type: SchemaType.BOOLEAN },
        stepLabel: { type: SchemaType.STRING, description: "short Chinese label of what they did" },
        feedback: { type: SchemaType.STRING, description: "your Personalized & Adaptive Chinese feedback" },
        isSolved: { type: SchemaType.BOOLEAN }
    },
    required: ["latex", "isCorrect", "stepLabel", "feedback", "isSolved"]
};

const MAX_PAYLOAD_SIZE = 4.5 * 1024 * 1024; // 4.5MB
const MAX_IMAGE_BASE64_LENGTH = 4 * 1024 * 1024; // 4MB limit for base64 string

export async function POST(req: NextRequest) {
    try {
        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }

        const body = await req.json();
        const { imageBase64, problemContext, history, manualText } = body;

        if (!imageBase64 && !manualText) {
            return NextResponse.json({ error: 'No image or text data provided' }, { status: 400 });
        }

        if (imageBase64 && (typeof imageBase64 !== 'string' || imageBase64.length > MAX_IMAGE_BASE64_LENGTH)) {
            return NextResponse.json({ error: 'Image too large or invalid format' }, { status: 413 });
        }

        const promptText = [
            'You are a "Deep Socratic Math Tutor" for Chinese students. Your goal is to guide them through a problem naturally, following THEIR logic, not a fixed script.',
            `Problem Context: ${problemContext || 'Unknown'}`,
            manualText ? `Student's Input (Typed Text): ${manualText}` : 'Student\'s Input: (See handwritten image)',
            '',
            'Previous Correct Steps:',
            history && history.length > 0 ? history.map((s: { latex?: string, expression?: string }, i: number) => `Step ${i + 1}: ${s.latex || s.expression}`).join('\n') : 'None',
            '',
            'ADAPTIVITY RULES:',
            'Analyze the student\'s history to determine their proficiency level:',
            '- HIGH PROFICIENCY (Fast, no errors): Be concise. Use brief affirmations (e.g., "很好", "对"). Only provide hints if they specifically ask "不会".',
            '- LOW PROFICIENCY (Stuck, repeat errors, or writes "不会"): Be more proactive. Break the problem into smaller sub-goals. Use encouraging language and guide them step-by-step.',
            '',
            'Your Core Principles:',
            '1. DO NOT be repetitive...',
            '2. FOLLOW THE STUDENT...',
            '3. HANDLING STUCKNESS...',
            '4. SOCRATIC FEEDBACK...',
            '5. DISCRIMINANT (Δ)...',
            '',
            'Output the result in the specified JSON format.'
        ].join('\n');

        const parsedData = await generateFromImage<Record<string, unknown>>(promptText, imageBase64 || "", ocrSchema as Record<string, unknown>, "ocr");

        if (typeof parsedData.latex === 'string') {
            parsedData.latex = parsedData.latex.replace(/\$/g, '');
        }

        return NextResponse.json(parsedData);

    } catch (error: unknown) {
        console.error('OCR API error:', error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            { latex: '', isCorrect: false, feedback: 'Server error: ' + (error instanceof Error ? error.message : 'unknown') },
            { status: 200 }
        );
    }
}
