from PIL import Image
import os

img = Image.open(r"c:\Users\zuoyi\Desktop\交配\Smse\extracted\pages\上海市崇明区2022届九年级上学期期末(一模）质量调研数学试卷（word原卷版）\page_4.png")
w, h = img.size
strip_h = h // 10
os.makedirs("debug_strips_p4", exist_ok=True)
for i in range(10):
    img.crop((0, i*strip_h, w, (i+1)*strip_h)).save(f"debug_strips_p4/strip_{i}.png")
