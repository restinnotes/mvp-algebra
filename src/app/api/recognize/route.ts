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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imageBase64, problemContext, history, manualText } = body;

        if (!imageBase64 && !manualText) {
            return NextResponse.json({ error: 'No image or text data provided' }, { status: 400 });
        }

        const base64Data = imageBase64
            ? imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '')
            : "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; // 1px dummy

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

        const parsedData: any = await generateFromImage(promptText, imageBase64 || "", ocrSchema as any, "ocr");

        if (parsedData.latex) {
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
