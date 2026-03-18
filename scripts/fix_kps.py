import json
import glob
import os

# 知识点名称到 ID 的映射表
KP_MAP = {
    "相似图形的定义": "geo_similar_judge",
    "锐角三角比": "geo_trig_def",
    "余切定义": "geo_trig_def",
    "二次函数的图像与性质": "alg_func_quadratic_image",
    "顶点坐标": "alg_func_quadratic_vertex",
    "向量的概念": "alg_expr_concept",
    "向量的线性运算": "alg_expr_calc",
    "圆的性质": "geo_circle_basic",
    "垂径定理": "geo_circle_basic",
    "相似三角形的性质": "geo_similar_prop",
    "平行线分线段成比例": "geo_similar_judge",
    "比例的性质": "alg_expr_calc",
    "黄金分割": "geo_similar_prop",
    "解直角三角形的应用": "geo_trig_app",
    "坡度坡角问题": "geo_trig_app",
    "相似三角形的应用": "geo_similar_adv",
    "二次函数的平移": "geo_motion_translate",
    "对称性": "alg_func_quadratic_axis",
    "正多边形的性质": "geo_quad_property",
    "圆与圆的位置关系": "geo_circle_pos",
    "相似三角形判定": "geo_similar_judge",
    "等腰三角形的性质": "geo_triangle_basic",
    "三角形面积": "geo_triangle_basic",
    "翻折变换": "geo_motion_fold",
    "勾股定理": "geo_trig_app",
    "特殊角的三角比": "geo_trig_calc",
    "相似三角形性质": "geo_similar_prop",
    "相似三角形的判定与性质": "geo_similar_adv",
    "圆内接四边形(隐含)": "geo_circle_adv",
    "二次函数解析式": "alg_func_quadratic",
    "等腰三角形性质": "geo_triangle_basic",
    "三角比": "geo_trig_def",
    "点的坐标与函数解析式的关系": "alg_expr_eval",
    "二次函数的旋转变换": "geo_motion_rotation",
    "直线的倾斜角": "geo_trig_def",
    "相似三角形的判定": "geo_similar_judge",
    "尺规作图": "geo_aux_line",
    "三角形全等的判定": "geo_congruent_judge",
    "分式函数的定义域": "alg_fraction_concept",
    "正比例函数的性质": "alg_func_linear_property",
    "二次函数图像与象限的关系": "alg_func_quadratic_image",
    "中位线性质": "geo_triangle_basic",
    "相似三角形周长比": "geo_similar_prop",
    "重心性质": "geo_similar_prop",
    "菱形性质": "geo_quad_property",
    "正方形性质": "geo_quad_property",
    "反比例函数解析式": "alg_func_inverse",
    "矩形性质": "geo_quad_property",
    "仰角俯角问题": "geo_trig_app",
    "相似四边形的判定与性质": "geo_similar_adv",
    "等腰直角三角形": "geo_triangle_basic",
    "图像平移": "geo_motion_translate",
    "待定系数法": "alg_func_linear_determine",
    "梯形性质": "geo_quad_property"
}

def fix_kps(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            return
            
    if not isinstance(data, list):
        return
        
    changed = False
    for q in data:
        new_kps = []
        old_kps = q.get("kps", [])
        for kp in old_kps:
            # 如果是中文描述，尝试转换成 ID
            if kp in KP_MAP:
                new_kps.append(KP_MAP[kp])
                changed = True
            else:
                new_kps.append(kp)
        
        # 确保 ID 唯一
        q["kps"] = list(set(new_kps))
        
        # 顺便把 district 和 paper 补充完整
        if "paper" in q:
            # 自动提取年份和区
            parts = q["paper"].split("_")
            if len(parts) >= 3:
                q["year"] = parts[0]
                q["district"] = parts[1]
                q["exam_type"] = parts[2]
            
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Fixed KPs in {filepath}")

for f in glob.glob("mvp-algebra-fixed/src/data/papers/*.json"):
    fix_kps(f)
