import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imageBase64, stepLabel, expectedResult } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
        }

        const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

        const promptText = [
            'You are a professional math tutor grading a Chinese middle school student.',
            `Current step goal: [${stepLabel || 'unknown'}]`,
            `Expected result concept: [${expectedResult || 'unknown'}]`,
            '',
            'Look at the handwritten image and:',
            '1. Extract the math formula as clean LaTeX (NO $ or $$ delimiters!)',
            '2. Judge if the student\'s work correctly achieves the step goal. Be lenient: if their logic is right, mark correct.',
            '3. If wrong, give a short Chinese hint.',
            '',
            'Output ONLY this JSON (no markdown, no ```):',
            '{"latex":"clean latex string","isCorrect":true or false,"feedback":"hint if wrong, empty string if correct"}'
        ].join('\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
        const geminiResult = await model.generateContent([
            promptText,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/png'
                }
            }
        ]);
        const response = await geminiResult.response;

        const rawText = (response.text() || '').trim();
        const cleanedText = rawText.replace(/```json|```/g, '').trim();

        let parsedData;
        try {
            parsedData = JSON.parse(cleanedText);
        } catch {
            console.error('Gemini JSON parse failed:', cleanedText);
            parsedData = { latex: cleanedText.substring(0, 200), isCorrect: false, feedback: 'AI returned unexpected format' };
        }

        if (parsedData.latex) {
            parsedData.latex = parsedData.latex.replace(/\$/g, '');
        }

        return NextResponse.json(parsedData);

    } catch (error: any) {
        console.error('OCR API error:', error?.message || error);
        return NextResponse.json(
            { latex: '', isCorrect: false, feedback: 'Server error: ' + (error?.message || 'unknown') },
            { status: 200 }
        );
    }
}
