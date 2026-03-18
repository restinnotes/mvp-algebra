from PIL import Image
import os

def slice_page(page_path, output_dir, strips=40):
    if not os.path.exists(page_path):
        print(f"File {page_path} not found.")
        return
    img = Image.open(page_path)
    width, height = img.size
    strip_height = height // strips
    os.makedirs(output_dir, exist_ok=True)
    
    for i in range(strips):
        top = i * strip_height
        bottom = (i + 1) * strip_height if i < strips - 1 else height
        strip = img.crop((0, top, width, bottom))
        strip.save(os.path.join(output_dir, f"strip_{i:02d}.png"))
    print(f"Sliced {page_path} into {strips} strips in {output_dir}")

base_path = r"c:\Users\zuoyi\Desktop\交配\Smse\extracted\pages\上海市崇明区2022届九年级上学期期末(一模）质量调研数学试卷（word原卷版）"

# Slice Page 2
slice_page(os.path.join(base_path, "page_2.png"), r"c:\Users\zuoyi\Desktop\交配\mvp-algebra-fixed\debug_fix_p2")
# Slice Page 5
slice_page(os.path.join(base_path, "page_5.png"), r"c:\Users\zuoyi\Desktop\交配\mvp-algebra-fixed\debug_fix_p5")
# Slice Page 6
slice_page(os.path.join(base_path, "page_6.png"), r"c:\Users\zuoyi\Desktop\交配\mvp-algebra-fixed\debug_fix_p6")
