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

    async function test() {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
            const data = await res.json();
            fs.writeFileSync("models.json", JSON.stringify(data, null, 2));
        } catch (e) {
            fs.writeFileSync("models.json", "FETCH ERROR\n" + e.message);
        }
    }
    test();
} catch (e) {
    fs.writeFileSync("models.json", "SETUP ERROR\n" + e.toString());
}
