from PIL import Image
import os

def crop_diagrams():
    base_path = r"c:\Users\zuoyi\Desktop\交配\Smse\extracted\pages\上海市崇明区2022届九年级上学期期末(一模）质量调研数学试卷（word原卷版）"
    output_dir = r"c:\Users\zuoyi\Desktop\交配\mvp-algebra-fixed\public\problems\2022_Chongming_One_Mock"
    os.makedirs(output_dir, exist_ok=True)

    # (x1, y1, x2, y2)
    crops = {
        "1": {
            "6": (1750, 1400, 2450, 2050),
        },
        "2": {
            "14": (1700, 1100, 2450, 1450),
            "15": (1700, 1450, 2450, 1800),
            "16": (1700, 1800, 2450, 2200),
            "17": (350, 2800, 1200, 3300),
            "18": (1600, 2800, 2450, 3300),
        },
        "3": {
            "20": (1650, 1750, 2450, 2150),
            "21": (1650, 2400, 2450, 2900),
        },
        "4": {
            "22": (1600, 1050, 2450, 1800),
            "23": (1550, 2450, 2450, 3200),
        },
        "5": {
            "24": (1300, 1400, 2481, 2300), # Parabola
        },
        "6": {
            "25": (600, 1100, 2481, 2300), # Multiple diagrams
        }
    }

    for page_num, problem_crops in crops.items():
        img_path = os.path.join(base_path, f"page_{page_num}.png")
        if not os.path.exists(img_path):
            print(f"Page {page_num} not found at {img_path}")
            continue
        
        img = Image.open(img_path)
        for prob_num, box in problem_crops.items():
            cropped = img.crop(box)
            save_path = os.path.join(output_dir, f"{prob_num}.png")
            cropped.save(save_path)
            print(f"Saved {save_path}")

if __name__ == "__main__":
    crop_diagrams()
