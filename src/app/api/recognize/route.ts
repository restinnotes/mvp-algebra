import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
            history && history.length > 0 ? history.map((s: any, i: number) => `Step ${i + 1}: ${s.latex || s.expression}`).join('\n') : 'None',
            '',
            'ADAPTIVITY RULES:',
            'Analyze the student\'s history to determine their proficiency level:',
            '- HIGH PROFICIENCY (Fast, no errors): Be concise. Use brief affirmations (e.g., "很好", "对"). Only provide hints if they specifically ask "不会".',
            '- LOW PROFICIENCY (Stuck, repeat errors, or writes "不会"): Be more proactive. Break the problem into smaller sub-goals. Use encouraging language and guide them step-by-step.',
            '',
            'Your Core Principles:',
            '1. DO NOT be repetitive. If you already mentioned a hint (like the discriminant), do NOT repeat it unless the student specifically asks or makes the same mistake again.',
            '2. FOLLOW THE STUDENT: Analyze the specific image provided. If the student is trying a valid but non-standard path, support it. Do NOT force them into a "standard" solution.',
            '3. HANDLING STUCKNESS: If the student writes "I don\'t know", "不会", or seems stuck, look at their last correct step and suggest ONLY the immediate next logical hurdle. Ask a question to spark their memory.',
            '4. SOCRATIC FEEDBACK: If they make a mistake, identify the EXACT logical error in their current step. Provide a hint in Chinese that helps them see the error themselves.',
            '5. DISCRIMINANT (Δ): Only mention the discriminant/real roots condition IF the student has found candidate values for the variable and needs to verify them, or if their current step directly relates to it. Don\'t preach it at every step.',
            '',
            'Output ONLY this JSON object:',
            '{"latex":"the recognized latex or text","isCorrect":true|false,"stepLabel":"short Chinese label of what they did","feedback":"your Personalized & Adaptive Chinese feedback","isSolved":true|false}'
        ].join('\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
        const geminiResult = await model.generateContent([
            {
                text: promptText,
            },
            {
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/png'
                }
            }
        ]);
        const response = await geminiResult.response;
        const rawText = (response.text() || '').trim();

        // Robust JSON extraction
        let parsedData;
        try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            const cleanedText = jsonMatch ? jsonMatch[0] : rawText;
            parsedData = JSON.parse(cleanedText);
        } catch (e) {
            console.error('Gemini JSON parse failed. Raw text:', rawText);
            parsedData = {
                latex: "Parse Error",
                isCorrect: false,
                feedback: 'AI返回格式异常，请重试或检查公式是否清晰',
                stepLabel: 'Unknown',
                isSolved: false
            };
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
