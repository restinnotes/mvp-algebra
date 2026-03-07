# AI Math Tutor - Zero-Question-Bank MVP (Gemini 3.1 Edition)

这是一个基于 Next.js 开发的 AI 数学辅导应用。本项目核心优势在于其 **AI 原生解题引擎**：

- **影子解题 (Shadow Solving)**：即使在没有预设题库的情况下，也能通过 Gemini 3.1 系列模型实现对任意上传题目的即时解析、逻辑拆解与阶梯辅导。
- **高兼容性**：系统可无缝对接现有题库，并在题库未覆盖时提供全自动的动态支架教学。

## 🚀 快速开始

### 1. 团队一键配置 (推荐)
如果你使用的是 Windows 系统，只需在项目根目录右键选择 **“使用 PowerShell 运行”** `setup.ps1` 脚本。
它会自动：
- 检查 Node.js 环境
- 安装所有依赖
- 提示输入并配置 API Key
- **自动检测并在屏幕上显示 iPad 访问的局域网 IP**

### 2. 手动启动
```bash
npm install
npm run dev
```
访问 `http://localhost:3000` 开始。

---

## 🎮 核心功能与工作流

本项目的核心是 **“影子解题 (Shadow Solving)”** 与 **“思路先行”** 的 Socratic 辅导模式：

1. **上传题目**：点击“上传新题目”，Gemini 3.1 Pro 在后台自动拆解题目为 3-5 个逻辑支架。
2. **语音讲思路**：系统强制要求在动笔前口述思路。Gemini 3.1 Flash Lite 会实时评估逻辑。
3. **阶梯式解题**：思路通过后，动态加载解题轴。学生每步手写，AI 实时判定正误。
4. **知识图谱**：内置 BKT 引擎，实时追踪并可视化掌握率。

## 📱 iPad 适配与 PWA 安装
为了提供最佳的手写体验，本项目针对 iPad 进行了深度优化：
- **PWA 支持**：在 iPad Safari 中打开网页，点击“分享”按钮 -> **“添加到主屏幕”**。这样可以隐藏浏览器工具栏，获得原生 App 般的沉浸感。
- **手写优化**：适配 Apple Pencil，并在绘图时锁定了页面滚动（防止误触导致的画布漂移）。
- **图片上传**：直接支持系统相册，截图后即可快速上传。

## 🧠 长期记忆系统 (LTM)
不同于普通的搜题工具，本项目会“记住”你：
- **BKT 掌握率**：每个知识点都有动态概率追踪，数据保存在本地跨 Session 共享。
- **数字画像**：Gemini 3.1 会定期根据你的解题表现（如思路、易错点）总结你的学习特性，并展示在侧边栏。

## � 参考与致谢
本项目在架构设计与逻辑流程上参考并吸取了以下优秀开源项目的经验：
- **[feilaz/AI_Powered_Math_Tutoring](https://github.com/feilaz/AI_Powered_Math_Tutoring)**：在 Long-Term Memory (LTM) 机制与 Agent 调度逻辑上提供了重要启发。
- **Gemini 3.1 系列模型**：由 Google DeepMind 提供支持，本项目深度使用了其 Pro (Decomposition) 与 Flash-Lite (Real-time Eval) 模型。
- **Next.js & Vercel**：提供了高效的开发框架与生产部署环境。

---

## �🔧 开发说明
- `src/app/api/decompose`: 影子解题引擎 (Pro)
- `src/app/api/evaluate-strategy`: 音频思路评估 (Flash Lite)
- `src/app/api/recognize`: 手写识别与判定 (Flash Lite)
- `src/components/DynamicScaffold.tsx`: 核心交互组件
