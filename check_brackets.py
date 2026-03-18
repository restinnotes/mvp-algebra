
import sys

def check_brackets(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    b_level = 0
    p_level = 0
    lines = content.splitlines()
    
    for i, line in enumerate(lines):
        line_num = i + 1
        for char in line:
            if char == '{':
                b_level += 1
            elif char == '}':
                b_level -= 1
                if b_level < 0:
                    print(f"Extra close brace at line {line_num}: {line.strip()}")
                    b_level = 0
            elif char == '(':
                p_level += 1
            elif char == ')':
                p_level -= 1
                if p_level < 0:
                    print(f"Extra close paren at line {line_num}: {line.strip()}")
                    p_level = 0
    
    print(f"Final levels - Braces: {b_level}, Parens: {p_level}")

if __name__ == "__main__":
    check_brackets(r'c:\Users\zuoyi\Desktop\交配\mvp-algebra-fixed\src\components\DynamicScaffold.tsx')
