from PIL import Image
import os

def crop_image(page_path, output_path, box):
    if not os.path.exists(page_path):
        print(f"Source not found: {page_path}")
        return
    img = Image.open(page_path)
    # Box is (left, top, right, bottom)
    cropped = img.crop(box)
    cropped.save(output_path)
    print(f"Saved: {output_path}")

src_dir = r"c:\Users\zuoyi\Desktop\交配\Smse\extracted\pages\上海市崇明区2022届九年级上学期期末(一模）质量调研数学试卷（word原卷版）"
dst_dir = r"c:\Users\zuoyi\Desktop\交配\mvp-algebra-fixed\public\problems\2022_Chongming_One_Mock"

if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)

# All pages are 2481x3508

crops = [
    # Page 1
    ("page_1.png", "6.png", (1750, 2030, 2400, 2800)),
    
    # Page 2
    ("page_2.png", "14.png", (1950, 240, 2450, 680)),
    ("page_2.png", "15.png", (1850, 670, 2450, 1050)),
    ("page_2.png", "16.png", (350, 1920, 850, 2480)),
    ("page_2.png", "17.png", (900, 1920, 1600, 2450)),
    ("page_2.png", "18.png", (1620, 1850, 2250, 2480)),
    
    # Page 3
    ("page_3.png", "20.png", (1450, 1630, 2300, 2450)),
    ("page_3.png", "21.png", (1680, 2250, 2300, 2980)),
    
    # Page 4
    ("page_4.png", "22.png", (1350, 1050, 2100, 1700)),
    ("page_4.png", "23.png", (1300, 2220, 2150, 2820)),
    
    # Page 5
    ("page_5.png", "24.png", (1450, 1050, 2200, 2600)),
    
    # Page 6
    ("page_6.png", "25.png", (350, 1150, 2200, 1680)),
]

for page_name, out_name, box in crops:
    crop_image(os.path.join(src_dir, page_name), os.path.join(dst_dir, out_name), box)
