import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';

const MAX_PAYLOAD_SIZE = 500 * 1024; // 500KB

export async function POST(req: NextRequest) {
        try {
                const contentLength = req.headers.get('content-length');
                if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
                        return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
                }

                const body = await req.json();
                const { problemContext, history } = body;

                if (!problemContext || !history || !Array.isArray(history)) {
                        return NextResponse.json({ error: 'Missing or invalid problemContext or history' }, { status: 400 });
                }

                if (typeof problemContext !== 'string' || problemContext.length > 5000) {
                        return NextResponse.json({ error: 'Invalid problemContext length or type' }, { status: 400 });
                }

                if (history.length > 200) {
                        return NextResponse.json({ error: 'History too long' }, { status: 400 });
                }

                const historyText = history.map((log: { contentType: string, latex?: string, text?: string, type: string }, i: number) => {
                        if (log.contentType !== 'math' && log.contentType !== 'text') {
                                return `[Step ${i + 1}] Unknown Content`;
                        }
                        if (log.latex && (typeof log.latex !== 'string' || log.latex.length > 1000)) return `[Step ${i + 1}] Invalid Math Content`;
                        if (log.text && (typeof log.text !== 'string' || log.text.length > 1000)) return `[Step ${i + 1}] Invalid Text Content`;

                        const content = log.contentType === 'math' ? `Math: ${log.latex || ''}` : `Text: ${log.text || ''}`;
                        return `[Step ${i + 1}] ${log.type === 'student' ? 'Student' : 'Tutor'}: ${content}`;
                }).join('\n');

                const promptText = `
        You are an Educational Quality Expert. Review the following math problem session and provide a "Post-Problem Reflection" (总结与复盘) for the student.
        Problem: ${problemContext}
        Session History:
        ${historyText}

        Your Goal:
        1. Summarize the CORE mathematical concepts used.
        2. Identify the "Critical Success Factor" or the "Hidden Trap" in this specific problem (e.g., "The discriminant condition Delta >= 0").
        3. Provide a brief "Mental Model" tip for the student (e.g., "Always check constraints before celebrating").
        4. Keep the tone encouraging and professional.

        Format (Chinese):
        ### 🎯 核心知识点
        - ...
        ### 💡 关键反思
        - ...
        ### 🧠 思维闭环
        - ...

        Output ONLY the markdown text.
        `;

                const summary = await generateText(promptText, "fast");
                return NextResponse.json({ summary: summary.trim() });

        } catch (error: unknown) {
                console.error('Review API error:', error);
                return NextResponse.json({ error: 'Failed to generate review' }, { status: 500 });
        }
}
