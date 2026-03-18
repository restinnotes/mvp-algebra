import json
import glob
import os

def standardize_data(filepath):
    filename = os.path.basename(filepath).lower()
    
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            return
            
    if not isinstance(data, list):
        return
        
    changed = False
    for q in data:
        # 1. 修正 exam_type
        old_et = q.get("exam_type", "")
        new_et = old_et
        
        # 根据文件名判断
        if "one_mock" in filename or "一模" in filename or "mock" in filename:
            new_et = "一模"
        elif "two_mock" in filename or "二模" in filename:
            new_et = "二模"
        
        if new_et != old_et:
            q["exam_type"] = new_et
            changed = True
            
        # 2. 修正 district
        old_dist = q.get("district", "")
        new_dist = old_dist
        
        dist_map = {
            "baoshan": "宝山",
            "chongming": "崇明",
            "fengxian": "奉贤",
            "hongkou": "虹口",
            "huangpu": "黄浦",
            "pudong": "浦东",
            "putuo": "普陀",
            "xuhui": "徐汇",
            "qingpu": "青浦",
            "songjiang": "松江",
            "yangpu": "杨浦",
            "changning": "长宁",
            "jingshan": "金山",
            "jingan": "静安",
            "minhang": "闵行"
        }
        
        for en, cn in dist_map.items():
            if en in filename:
                new_dist = cn
                break
        
        if new_dist != old_dist:
            q["district"] = new_dist
            changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Standardized {filepath}")

for f in glob.glob("mvp-algebra-fixed/src/data/papers/*.json"):
    standardize_data(f)
