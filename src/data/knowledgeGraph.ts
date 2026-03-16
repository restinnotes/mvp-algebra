export interface KnowledgeNode {
    id: string;
    name: string;
    level: number; // 认知层级: 1-基础, 2-应用, 3-综合
    importance: number; // 考纲重要程度: 1-5
    description: string;
    prerequisites: string[]; // 前置节点ID
}

export interface QuestionMapping {
    q_id: string;
    content: string;
    difficulty: number;
    steps: {
        step_id: number;
        mapped_node: string; // 每一步对应考核哪个极细粒度的知识点
    }[];
}

// 华东师大 SocraticMath 风格的“韦达定理”单点爆发型知识切片
export const AlgebraSyllabus = {
    module: "一元二次方程与参变量",
    nodes: [
        {
            id: "kp_001",
            name: "一元二次方程的判别式前提",
            level: 1,
            importance: 5,
            description: "判断有两个实数根时，必须满足 Δ = b^2 - 4ac >= 0，这是易错的隐式边界条件。",
            prerequisites: []
        },
        {
            id: "kp_002",
            name: "韦达定理的应用 (求和与求积)",
            level: 1,
            importance: 5,
            description: "直接提取系数 a,b,c 并应用 x1+x2=-b/a, x1x2=c/a。注意负号的处理。",
            prerequisites: []
        },
        {
            id: "kp_003",
            name: "根的对称式变形 (完全平方)",
            level: 2,
            importance: 4,
            description: "应用乘法公式变形，如 x1^2+x2^2 = (x1+x2)^2 - 2x1x2",
            prerequisites: ["kp_002"]
        },
        {
            id: "kp_004",
            name: "分式的通分与降次变形",
            level: 2,
            importance: 4,
            description: "处理形如 1/x1 + 1/x2 的分式，通分为 (x1+x2)/x1x2 以便代入韦达定理",
            prerequisites: ["kp_002"]
        },
        {
            id: "kp_005",
            name: "全局根的取舍检验",
            level: 3,
            importance: 5,
            description: "解出参变量后，必须代回 kp_001 的判别式不等式中验证合法性，剔除增根或非法值。",
            prerequisites: ["kp_001", "kp_002"]
        }
    ] as KnowledgeNode[],

    // 第一道母题的切片映射关系
    // 这种结构的好处是：学生在 Step 3 错了，系统明确知道他是 kp_004（分式通分）不行，而不是韦达定理全盘不行。
    questions: [
        {
            q_id: "q_vieta_001",
            content: "已知关于 x 的方程 x^2 - (2m+1)x + m^2 + m = 0 有两个实数根 x1, x2。若 1/x1 + 1/x2 = 3/2，求实数 m 的值。",
            difficulty: 0.7,
            steps: [
                { step_id: 1, mapped_node: "kp_001" }, // 计算 Δ
                { step_id: 2, mapped_node: "kp_002" }, // 列和与积
                { step_id: 3, mapped_node: "kp_004" }, // 处理分式通分
                { step_id: 4, mapped_node: "kp_005" }  // 解方程并验证取舍
            ]
        }
    ] as QuestionMapping[]
};
