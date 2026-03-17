export interface KnowledgeNode {
    id: string; // ms_q24_001 etc
    name: string;
    level: number;
    description: string;
    children?: KnowledgeNode[];
}

export const MindmapSyllabus: KnowledgeNode[] = [
    {
        id: "root_numbers",
        name: "数与运算 (Numbers)",
        level: 1,
        description: "实数体系、代数式运算与基本定义",
        children: [
            { id: "num_ops_sci_notation", name: "实数运算与科学记数法", level: 2, description: "掌握绝对值、根号运算及大数的科学表示。" },
            { id: "num_frac_root_simplify", name: "分式与二次根式化简", level: 2, description: "掌握复杂代数式的变形技巧与分母有理化。" }
        ]
    },
    {
        id: "root_algebra",
        name: "代数综合 (Algebra)",
        level: 1,
        description: "涵盖函数、方程、抛物线等核心代数模块",
        children: [
            {
                id: "sub_equations",
                name: "方程、不等式与比例",
                level: 2,
                description: "一元二次方程、分式方程及函数的对应关系",
                children: [
                    { id: "alg_quad_discriminant", name: "一元二次方程判别式应用", level: 3, description: "利用 Δ 判定根的情况，并与系数关系结合。" },
                    { id: "alg_prop_func_coeff", name: "正反比例函数解析式", level: 3, description: "确定比例系数 k 及其几何意义（k 的绝对值与面积）。" }
                ]
            },
            {
                id: "sub_parabola",
                name: "抛物线综合应用",
                level: 2,
                description: "抛物线图像与性质的综合考查（演示关卡核心）",
                children: [
                    { id: "alg_parabola_intercepts", name: "直线截距与轴交点判定", level: 3, description: "利用一次函数截距快速锁定交点，避免盲目代入顶点公式。" },
                    { id: "alg_parabola_undetermined_coeff", name: "待定系数法求二次解析式", level: 3, description: "利用交点坐标准确解出 a, c，注意计算准确度。" }
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
                id: "sub_similarity",
                name: "相似形、锐角三角比与向量",
                level: 2,
                description: "经典几何推导与向量线性运算",
                children: [
                    { id: "geo_similarity_models", name: "相似三角形判定与性质", level: 3, description: "掌握‘A’字型、‘X’字型等经典相似模型的归纳。" },
                    { id: "geo_vector_ops", name: "向量分解与平行向量表示", level: 3, description: "掌握几何向量的加减法法则及合成分解。" }
                ]
            },
            {
                id: "sub_coords",
                name: "解析几何与坐标系构建",
                level: 2,
                description: "在纯几何图形中建立直角坐标系转化为代数问题",
                children: [
                    { id: "geo_coord_quadrant", name: "象限符号判定", level: 3, description: "根据图形相对位置，准确附加坐标系中的正负号。" }
                ]
            },
            {
                id: "sub_circle",
                name: "圆与直线的位置关系",
                level: 2,
                description: "多解性探究与辅助线构建",
                children: [
                    { id: "geo_circle_line_relation", name: "相切/相交的分类讨论", level: 3, description: "圆在两条平行线间或同侧会有不同情况，具备分情况讨论意识。" },
                    { id: "geo_dist_radius_conv", name: "圆半径与几何距离转化", level: 3, description: "将抽象的几何位置关系快速映射为点到直线的距离和半径运算。" }
                ]
            }
        ]
    },
    {
        id: "root_stats",
        name: "统计与概率基础 (Stats)",
        level: 1,
        description: "数据处理与随机事件概率",
        children: [
            { id: "stat_central_tendency", name: "众数、中位数与加权平均", level: 2, description: "准确理解统计量在不同分布下的描述意义。" },
            { id: "stat_prob_tree_table", name: "树状图与列表法求概率", level: 2, description: "对两步或多步随机事件进行穷举分析。" }
        ]
    }
];
