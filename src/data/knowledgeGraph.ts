export interface KnowledgeNode {
    id: string; // ms_q24_001 etc
    name: string;
    level: number;
    description: string;
    children?: KnowledgeNode[];
}

export const MindmapSyllabus: KnowledgeNode[] = [
    {
        id: "root_algebra",
        name: "代数综合 (Algebra)",
        level: 1,
        description: "涵盖函数、方程、抛物线等核心代数模块",
        children: [
            {
                id: "sub_parabola",
                name: "抛物线综合应用",
                level: 2,
                description: "抛物线图像与性质的综合考查",
                children: [
                    { id: "ms_q24_001", name: "直线截距与轴交点判定", level: 3, description: "利用一次函数截距快速锁定交点，避免盲目代入顶点公式。" },
                    { id: "ms_q24_002", name: "待定系数法求二次解析式", level: 3, description: "利用交点坐标准确解出 a, c，注意计算准确度。" }
                ]
            }
        ]
    },
    {
        id: "root_geometry",
        name: "几何综合 (Geometry)",
        level: 1,
        description: "涵盖图形变换、圆、三角函数等",
        children: [
            {
                id: "sub_coords",
                name: "解析几何与坐标系构建",
                level: 2,
                description: "在纯几何图形中建立直角坐标系转化为代数问题",
                children: [
                    { id: "ms_q18_001", name: "象限符号判定", level: 3, description: "根据图形相对位置，准确附加坐标系中的正负号。" },
                    { id: "ms_q18_002", name: "严谨的代数推导", level: 3, description: "通过坐标列出清晰的方程组，拒绝跳步凭空“猜想”。" }
                ]
            },
            {
                id: "sub_circle",
                name: "圆与直线的位置关系",
                level: 2,
                description: "多解性探究",
                children: [
                    { id: "ms_q18_003", name: "相切/相交的分类讨论", level: 3, description: "圆在两条平行线间或同侧会有不同情况，具备分情况讨论意识。" },
                    { id: "ms_shared_001", name: "圆半径与几何距离转化", level: 3, description: "将抽象的几何位置关系快速映射为点到直线的距离和半径运算。" }
                ]
            }
        ]
    }
];
