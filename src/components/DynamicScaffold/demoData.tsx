export const getDemoScript = (index: number) => {
    const scripts = [
        // Script 0: 2022 浦东 Q24 (Algebra/Parabola)
        {
            problem: "2022浦东Q24: 见图。抛物线与直线 y=-x+3 分别交于x轴、y轴（点B在x轴正半轴，点C在y轴上），抛物线经过B、C两点，且对称轴为直线 x=1。求抛物线解析式；若点D为顶点，求tan∠BCD。",
            problemImage: <img src="/problems/pudong_q24.png" alt="2022浦东Q24配图" className="w-full max-w-sm mx-auto mt-4 rounded-lg bg-white/90 p-2 object-contain" />,
            steps: [
                { id: 'p1', type: 'student' as const, contentType: 'text' as const, text: '直接用顶点公式，不需要管直线。', label: '解题思路', message: '漏掉关键信息了！抛物线和直线的交点决定了 a 和 c。先求 B, C 点坐标。', isCorrect: false },
                { id: 'p2', type: 'student' as const, contentType: 'text' as const, text: '先求直线与坐标轴交点B、C，代入抛物线求a,c，再配方求顶点D。', label: '解题思路', message: '思路非常清晰！第一步先锁定交点。', isCorrect: true },
                { id: 'p3', type: 'student' as const, contentType: 'math' as const, latex: 'B(3,0), C(0,3)', label: '交点计算', message: '非常准确，直线与轴的交点是解题基石。', isCorrect: true },
                { id: 'p4', type: 'student' as const, contentType: 'math' as const, latex: 'a=1, c=3', label: '求参', message: 'c 是对的，但 a 的开口方向好像搞反了？对称轴在 x=1 情况下的 a 应该是多少？', isCorrect: false },
                { id: 'p5', type: 'student' as const, contentType: 'math' as const, latex: 'a=-1, c=3', label: '求参', message: '解析式确定了：y = -x² + 2x + 3。', isCorrect: true },
            ],
            kps: { 'alg_parabola_intercepts': 0.3, 'alg_parabola_undetermined_coeff': 0.4 },
            review: "学生初始未能充分利用直线截距确定交点，直接代入顶点。后续计算a值出现错误。最终在指导下完成，需提升条件分析和计算准确性。"
        },
        // Script 1: 2022 徐汇 Q18 (Geometry/Windmill)
        {
            problem: "2022徐汇Q18: 如图, 四个白色全等直角三角形与四个黑色全等直角三角形按如图方式摆放成“风车”型，黑色三角形的一个顶点E在白色直角三角形的斜边上。已知∠ABO=90°, OB=3, AB=4。若点A、E、D在同一直线上, 则OE的长为______。",
            problemImage: <img src="/problems/xuhui_q18.png" alt="2022徐汇Q18配图" className="w-full max-w-sm mx-auto mt-4 rounded-lg bg-white/90 p-2 object-contain" />,
            steps: [
                { id: 'x1', type: 'student' as const, contentType: 'text' as const, text: '画辅助线，直接勾股定理求OE。', label: '解题思路', message: '这题直接画辅助线很难求出准确值。考虑一下建立平面直角坐标系？', isCorrect: false },
                { id: 'x2', type: 'student' as const, contentType: 'text' as const, text: '以O为原点建立坐标系，确定A,B,C,D坐标，求出直线AD和OC解析式求交点E。', label: '解题思路', message: '非常棒的数形结合思想！', isCorrect: true },
                { id: 'x3', type: 'student' as const, contentType: 'math' as const, latex: 'A(-4,-3), D(3,0)', label: '坐标确定', message: '完全正确，数形结合的第一步。', isCorrect: true },
                { id: 'x4', type: 'student' as const, contentType: 'math' as const, latex: 'OE=15/13', label: '计算交点', message: '这个比例关系代入直线方程验证了吗？注意 OE 是向量模长。', isCorrect: false },
                { id: 'x5', type: 'student' as const, contentType: 'math' as const, latex: 'OE=45/37', label: '最终结果', message: '计算非常严谨！这就是通过解析法求得的精确值。', isCorrect: true },
            ],
            kps: { 'geo_windmill_geometry': 0.2, 'geo_windmill_coord_method': 0.45 },
            review: "学生初步能想到建系解决风车模型，但在象限坐标符号判定上出错。且缺乏代数方程组求解的严谨性，企图蒙答案。"
        },
        // Script 2: 2022 虹口 Q18 (Parallel Lines/Circles)
        {
            problem: "2022虹口Q18: 已知平行直线 l1、l2 之间的距离是 5cm，圆心 O 到直线 l1 的距离是 2cm，如果圆 O 与直线 l1、l2 有三个公共点，那么圆 O 的半径为______cm．",
            problemImage: <img src="/problems/hongkou_q18.png" alt="2022虹口Q18配图" className="w-full max-w-sm mx-auto mt-4 rounded-lg bg-white/90 p-2 object-contain" />,
            steps: [
                { id: 'h1', type: 'student' as const, contentType: 'text' as const, text: '半径就是直线距离，r=5。', label: '解题思路', message: '只考虑了一种情况。圆心是在两直线中间，还是在同侧？', isCorrect: false },
                { id: 'h2', type: 'student' as const, contentType: 'text' as const, text: '分情况讨论：要求有三个公共点，说明圆与其中一条直线相切，与另一条相交。根据圆心位置分两种情况。', label: '解题思路', message: '逻辑很严密。', isCorrect: true },
                { id: 'h3', type: 'student' as const, contentType: 'math' as const, latex: 'r=3', label: '半径计算', message: '这只是其中一个解，另一个情况（圆心在两直线外侧）呢？', isCorrect: false },
                { id: 'h4', type: 'student' as const, contentType: 'math' as const, latex: 'r=3 或 r=7', label: '完整求解', message: '恭喜！考虑全面。', isCorrect: true },
            ],
            kps: { 'geo_circle_line_relation': 0.5, 'geo_pythagorean_dist': 0.4 },
            review: "学生初次解答忽略了圆与两平行线位置关系的分类讨论。经提示后能迅速补全“圆心在两侧”与“圆心在同侧”两种情况并得出所有正确答案，理解力强。"
        }
    ];
    return scripts[index % scripts.length];
};
