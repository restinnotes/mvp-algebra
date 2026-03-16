import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

try {
    const envStr = fs.readFileSync(".env.local", "utf-8");
    let apiKey = "";
    const quoteMatch = envStr.match(/GEMINI_API_KEY="([^"]+)"/);
    if (quoteMatch) {
        apiKey = quoteMatch[1];
    } else {
        const rawMatch = envStr.match(/GEMINI_API_KEY=([^\s]+)/);
        if (rawMatch) apiKey = rawMatch[1];
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    async function test() {
        try {
            const result = await model.generateContent("Say 'hello world'");
            const response = await result.response;
            fs.writeFileSync("test-api.log", "SUCCESS (gemini-3.1-flash-lite-preview)\n" + response.text());
        } catch (e) {
            fs.writeFileSync("test-api.log", "API ERROR\n" + (e.stack || e.message || JSON.stringify(e, null, 2)));
        }
    }
    test();
} catch (e) {
    fs.writeFileSync("test-api.log", "SETUP ERROR\n" + e.toString());
}
