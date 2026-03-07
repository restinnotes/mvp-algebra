# AI Math Tutor - Zero-Question-Bank MVP (Gemini 3.1 Edition)

这是一个基于 Next.js 开发的 AI 数学辅导应用。本项目核心优势在于其 **AI 原生解题引擎**：

- **影子解题 (Shadow Solving)**：即使在没有预设题库的情况下，也能通过 Gemini 3.1 系列模型实现对任意上传题目的即时解析、逻辑拆解与阶梯辅导。
- **高兼容性**：系统可无缝对接现有题库，并在题库未覆盖时提供全自动的动态支架教学。

## 🚀 快速开始

### 1. 环境准备
确保已安装 [Node.js](https://nodejs.org/) (建议 v18+)。

### 2. 获取代码
```bash
git clone https://github.com/restinnotes/mvp-algebra.git
cd mvp-algebra
```

### 3. 安装依赖
```bash
npm install
```

### 4. 配置环境变量
在项目根目录下创建一个 `.env.local` 文件，填入你的 Gemini API Key：
```env
GEMINI_API_KEY=你的_API_KEY
```

### 5. 启动开发服务器
```bash
npm run dev
```
访问 `http://localhost:3000` 即可开始。

---

## 🎮 核心功能与工作流

本项目的核心是 **“影子解题 (Shadow Solving)”** 与 **“思路先行”** 的 Socratic 辅导模式：

1. **上传题目**：点击“上传新题目”，Gemini 3.1 Pro 在后台自动拆解题目为 3-5 个逻辑支架。
2. **语音讲思路**：系统强制要求在动笔前口述思路。Gemini 3.1 Flash Lite 会实时评估逻辑。
3. **阶梯式解题**：思路通过后，动态加载解题轴。学生每步手写，AI 实时判定正误。
4. **知识图谱**：内置 BKT 引擎，实时追踪并可视化掌握率。

## 🛠️ 技术栈
- **Frontend**: Next.js, Tailwind CSS, Lucide React
- **AI Models**: Gemini 3.1 Pro (推理), Gemini 3.1 Flash Lite (实时交互)
- **Math**: React-KaTeX, Signature Canvas
- **Logic**: BKT (Bayesian Knowledge Tracing)

---

## 🔧 开发说明
- `src/app/api/decompose`: 影子解题引擎 (Pro)
- `src/app/api/evaluate-strategy`: 音频思路评估 (Flash Lite)
- `src/app/api/recognize`: 手写识别与判定 (Flash Lite)
- `src/components/DynamicScaffold.tsx`: 核心交互组件
