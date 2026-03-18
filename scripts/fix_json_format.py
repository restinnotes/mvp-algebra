import json
import glob
import os

def fix_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            return
            
    # If it's already a list, it might be fine, but let's check
    if isinstance(data, list):
        return
        
    # If it has the "questions" array, it's the wrong format
    if isinstance(data, dict) and "questions" in data and "paper" in data:
        paper_name = data["paper"]
        new_data = []
        for q in data["questions"]:
            new_q = {
                "paper": paper_name,
                "question": str(q.get("id", "")).replace("q", ""),
                "difficulty": q.get("difficulty", 0.5),
                "tags": [],
                "kps": q.get("knowledge_points", []),
                "content": q.get("text", "")
            }
            if "options" in q:
                new_q["options"] = q["options"]
            if "images" in q:
                new_q["images"] = q["images"]
            new_data.append(new_q)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, ensure_ascii=False, indent=2)
        print(f"Fixed {filepath}")

for f in glob.glob("mvp-algebra-fixed/src/data/papers/*.json"):
    fix_json(f)
