// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generate() {
    console.log("Generating for Script 0...");
    const prompt0 = `你是一位严谨的AI数学导师，正在辅导中考数学。
学生刚刚完成了一道题：“2022浦东Q24: 抛物线 y=ax²-2x+c 与直线 y=-x+3 分别交于x轴、y轴... 求顶点D坐标及tan∠BCD”

他的主要表现：
1. 初始思路时，忽略了直线截距确定的交点，直接想代入顶点公式。
2. 经过提醒后，正确算出交点，但在求参时出了一次计算错误（算成了a=1而不是a=1/4）。
3. 最后在提醒后做对了。

请简短总结他本轮的【解题报告】（50字内），并列出最新发现的【薄弱点】（2个简短短语组成的数组）。返回JSON格式：
{
  "review": "解题报告内容",
  "weaknesses": ["薄弱点1", "薄弱点2"]
}`;

    const res0 = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt0,
        config: { responseMimeType: "application/json" }
    });
    console.log("Script 0:\n", res0.text);

    console.log("Generating for Script 1...");
    const prompt1 = `你是一位严谨的AI数学导师。
学生刚刚完成：“2022徐汇Q18: 风车型直角三角形，OB=3, AB=4，求 OE 的长”

学生表现：
1. 初见风车模型想直接勾股。被提醒建系后，建系思路正确。
2. 在确定第三象限的A点坐标时，忽略了坐标的负号（写成A(4,3)）。
3. 最后没有解析式连立步骤，想蒙一个答案。

基于以上表现，返回简短的【解题报告】（50字内）和【薄弱点】数组。JSON格式：
{
  "review": "解题报告内容",
  "weaknesses": ["薄弱点1", "薄弱点2"]
}`;

    const res1 = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt1,
        config: { responseMimeType: "application/json" }
    });
    console.log("Script 1:\n", res1.text);

    console.log("Generating for Script 2...");
    const prompt2 = `你是一位严谨的AI数学导师。
学生完成：“2022虹口Q18: 圆O与两平行直线有三个公共点，求半径 r”

学生表现：
1. 直接说出了r=5这种只有单一情况的答案，忽略了圆心在两直线的中间还是同侧两种分类讨论的情况。
2. 经过提醒后马上想到了分类讨论并算出了两个正确答案 r=3 或 r=7。

返回简短的【解题报告】（50字内）和【薄弱点】数组。JSON格式：
{
  "review": "解题报告内容",
  "weaknesses": ["薄弱点1", "薄弱点2"]
}`;

    const res2 = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt2,
        config: { responseMimeType: "application/json" }
    });
    console.log("Script 2:\n", res2.text);
}

generate().catch(console.error);
