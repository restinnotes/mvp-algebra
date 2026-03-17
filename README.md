# AI Tutor - AI-Native K12 Tutoring Framework (Gemini 3.1 Edition)

这是一个实验性的 **AI 原生 (AI-Native) K12 辅导框架**。它不依赖于死板的预设题库，而是利用 Gemini 3.1 系列多模态大模型的推理能力，为所有 K12 学科（目前以理科为例）提供即时的、交互式的苏格拉底式辅导。

## 💡 核心理念：影子解题 (Shadow Solving)
传统的教育产品主打“搜题”，而我们主打“拆解”与“引导”：
- **脱离题库限制**：AI 像真人导师一样“现场解题”，并实时生成适配学生的逻辑轴（Dynamic Scaffolding）。
- **思路优先 (Reasoning First)**：在展示步骤前，强制要求学生口述或笔述解题方案。
- **动态支架**：根据 BKT (贝叶斯知识追踪) 算法，针对学生的薄弱环节自动调整引导的细致程度。

---

## 🎮 交互流 (The Socratic Flow)

1. **输入阶段 (Vision)**：学生上传/拍摄任意题目。
   - *后台逻辑*：Gemini 3.1 Pro 启动“影子解题”，构建逻辑步骤图谱与知识点标签。
2. **激活阶段 (Engagement)**：系统展示题目，但隐藏解题轴。
   - *学生操作*：通过语音（Web Speech API）讲出解题思路。
   - *AI 判定*：Gemini 3.1 Flash Lite 评估逻辑，错误则给予引导词，正确则“解锁”任务轴。
3. **分步攻克 (Scaffolding)**：
   - *学生操作*：在手写画布（iPad 优化）上完成当前步骤。
   - *AI 判定*：实时 OCR 识图，配合上下文进行智能判分。
4. **画像沉淀 (LTM)**：
   - *数据表现*：更新 BKT 掌握率雷达图。
   - *AI 画像*：总结本轮表现，自动更新长期的“误解标记”与“学习画像”。

---

## 🚀 快速开始

### 1. 团队一键配置 (推荐)
如果你使用的是 Windows 系统，只需在项目根目录右键选择 **“使用 PowerShell 运行”** `setup.ps1` 脚本。它会自动配置环境并显示 iPad 访问地址。

### 2. 手动启动
```bash
npm install && npm run dev
```

---

## 🤖 模型配置与角色分化 (Model Configuration)

本系统采用 **全链路统一模型管理**。所有核心任务（OCR、解题分解、画像总结）的模型选择已集中在 `src/lib/gemini.ts` 中，方便一键切换至国产模型或进行针对性调优。

- **核心要求**：必须使用支持 **多模态 (Multimodal)** 的模型，以实现视觉 OCR 与影子解题。
- **配置中心**: [src/lib/gemini.ts](file:///c:/Users/zuoyi/Desktop/交配/mvp-algebra-fixed/src/lib/gemini.ts)

### 如何修改角色模型?
修改 `MODELS` 常量中的对应角色即可：

```typescript
const MODELS = {
  reasoning: "gemini-3.1-flash-lite-preview", // 影子解题、策略评估
  persona: "gemini-3.1-flash-lite-preview",   // 长短期画像合并
  ocr: "gemini-3.1-flash-lite-preview",       // 手写画布 OCR 与反馈
  fast: "gemini-3.1-flash-lite-preview",      // 快速代数运算
} as const;
```

---

## 📱 iPad 适配与 PWA 安装
为了提供最佳的手写体验，本项目针对 iPad 进行了深度优化：
- **沉浸式 PWA**：建议在 iPad Safari 中点击“分享” -> **“添加到主屏幕”**，以获得全屏 App 体验。
- **手势锁定**：针对 Apple Pencil 优化，绘图时自动锁定页面滚动，防止漂移。

## 🧠 认知外骨骼：双轨记忆系统 (LTM)

本项目实现了一种独特的**硬知识 (Hard Skills)** 与 **软认知 (Soft Skills)** 双轨解耦建模方案。

### 1. 硬核考纲技能树 (Hard Skills Mindmap)
- **底层引擎**: 基于**贝叶斯知识追踪 (BKT)** 算法。
- **展现形式**: 递归嵌套的思维导图逻辑（`MindmapSyllabus`）。
- **指标**: 实时计算每个原子的中考考点（如：二次函数求参、象限符号判定）的掌握率百分比。
- **可视化**: 掌握程度通过颜色强度（翡翠绿 - 琥珀橙 - 玫瑰红）展现，未覆盖点显示为灰色虚线。

### 2. AI 认知行为图谱 (Soft Skills Profile)
- **底层引擎**: Gemini 3.1 Flash-Lite 动态诊断。
- **核心逻辑**: 当学生走完解题流，AI 会复盘其交互全链路，提取出**跨学科的行为习惯缺陷**（Cognitive Bugs）。
- **示例标签**: `符号漏写综合症`、`跳步心算易错`、`分类讨论意识薄弱`、`逻辑严密性欠缺`。
- **解耦优势**: 避免将“粗心”等习惯混入考纲树，确保硬知识评估的精准度，同时给学生提供深刻的自我行为习惯反思。

---

## 🛠️ 技术架构

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion (交互动画).
- **Core Engine**:
  - `src/app/api/decompose`: 影子解题引擎 (Pro)
  - `src/app/api/summarize-persona`: 认知画像合并引擎 (Flash Lite) - 负责跨 Session 记忆融合。
  - `src/lib/bkt.ts`: 贝叶斯知识追踪数学核心。
- **Design System**: 针对 iPad Pro 优化的深色玻璃拟态 UI，支持高频手写交互与坐标系感知。

---

## 📜 参考与致谢
- **[feilaz/AI_Powered_Math_Tutoring](https://github.com/feilaz/AI_Powered_Math_Tutoring)**：在 LTM 画像与 Agent 调度逻辑上的重要启发。
- **Gemini 3.1 系列模型**：提供多模态推理与苏格拉底式对话能力.
