import cv2
import numpy as np
import os
from pathlib import Path

# Configuration
PAPER_NAME = "2021_Minhang_Two_Mock"
SOURCE_ROOT = Path(r"C:\Users\zuoyi\Desktop\交配\Smse\extracted\pages\2021年上海市闵行区中考数学二模试卷（原卷版）")
OUTPUT_ROOT = Path(r"C:\Users\zuoyi\Desktop\交配\mvp-algebra-fixed\public\problems") / PAPER_NAME
OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

targets = [
    {"page": "page_1.png", "q": "q3_0", "box": [330, 170, 520, 480]},
    {"page": "page_2.png", "q": "q6_0", "box": [80, 170, 240, 480]},
    {"page": "page_2.png", "q": "q15_0", "box": [480, 170, 630, 380]},
    {"page": "page_3.png", "q": "q16_0", "box": [80, 170, 300, 380]},
    {"page": "page_3.png", "q": "q17_0", "box": [400, 170, 520, 300]},
    {"page": "page_3.png", "q": "q18_0", "box": [670, 170, 790, 420]},
    {"page": "page_4.png", "q": "q21_0", "box": [280, 170, 420, 480]},
    {"page": "page_4.png", "q": "q23_0", "box": [610, 170, 740, 450]},
    {"page": "page_4.png", "q": "q24_0", "box": [720, 170, 860, 380]},
    {"page": "page_5.png", "q": "q25_0", "box": [710, 170, 865, 410]},
]

def crop_image(img_path, box, output_path):
    img_array = np.fromfile(str(img_path), np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    ymin, xmin, ymax, xmax = box
    y1, x1, y2, x2 = int(ymin * h / 1000), int(xmin * w / 1000), int(ymax * h / 1000), int(xmax * w / 1000)
    y1, x1 = max(0, y1), max(0, x1)
    y2, x2 = min(h, y2), min(w, x2)
    crop = img[y1:y2, x1:x2]
    is_success, buffer = cv2.imencode(".png", crop)
    if is_success:
        buffer.tofile(str(output_path))
        print(f"Saved {output_path.name}")

def main():
    for target in targets:
        source_path = SOURCE_ROOT / target["page"]
        output_name = f"{target['q']}.png"
        output_path = OUTPUT_ROOT / output_name
        crop_image(source_path, target["box"], output_path)

if __name__ == "__main__":
    main()
