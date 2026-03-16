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

## 📱 iPad 适配与 PWA 安装
为了提供最佳的手写体验，本项目针对 iPad 进行了深度优化：
- **沉浸式 PWA**：建议在 iPad Safari 中点击“分享” -> **“添加到主屏幕”**，以获得全屏 App 体验。
- **手势锁定**：针对 Apple Pencil 优化，绘图时自动锁定页面滚动，防止漂移。

## 🧠 长期记忆系统 (LTM)
通过 `localStorage` 持久化，本项目会跨 Session 记录每个知识点的掌握概率（BKT）以及 AI 总结的个性化学习建议。

## 📜 参考与致谢
本项目在架构设计上参考了以下开源项目与技术：
- **[feilaz/AI_Powered_Math_Tutoring](https://github.com/feilaz/AI_Powered_Math_Tutoring)**：在 LTM 画像与 Agent 调度逻辑上的重要启发。
- **Gemini 3.1 系列模型**：由 Google DeepMind 提供的一流多模态推理能力。

---

## �🔧 开发说明
- `src/app/api/decompose`: 影子解题引擎 (Pro)
- `src/app/api/evaluate-strategy`: 音频思路评估 (Flash Lite)
- `src/app/api/recognize`: 手写识别与判定 (Flash Lite)
- `src/components/DynamicScaffold.tsx`: 核心交互组件
