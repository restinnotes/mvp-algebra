
import re

def check_tags(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple tag matcher (doesn't handle all JSX complexity but should catch basic mismatches)
    # We look for <Tag and </Tag
    tags = re.findall(r'<([a-zA-Z0-9\.]+)|</([a-zA-Z0-9\.]+)>', content)
    
    stack = []
    for open_tag, close_tag in tags:
        if open_tag:
            # Check for self-closing tags like <img />, <br /> or custom components with />
            # This regex is too simple, let's refine.
            pass
    
    # Better approach: track all < and > and handle self-closing
    stack = []
    i = 0
    while i < len(content):
        if content[i:i+2] == '</':
            end = content.find('>', i)
            tag = content[i+2:end].strip()
            if not stack:
                print(f"Unexpected close tag </{tag}> at around line {content.count('\n', 0, i) + 1}")
            else:
                top = stack.pop()
                if top != tag:
                    print(f"Tag mismatch: expected </{top}>, found </{tag}> at line {content.count('\n', 0, i) + 1}")
            i = end + 1
        elif content[i] == '<' and not content[i+1].isspace() and content[i+1] != '/':
            # Potential open tag
            end = content.find('>', i)
            tag_part = content[i+1:end].strip()
            tag_name = tag_part.split()[0]
            
            # Check for self-closing
            if tag_part.endswith('/') or tag_name in ['img', 'br', 'hr', 'input']:
                # Self-closing
                pass
            else:
                stack.append(tag_name)
            i = end + 1
        else:
            i += 1
            
    if stack:
        print(f"Unclosed tags: {stack}")
    else:
        print("All tags balanced (basic check)")

if __name__ == "__main__":
    check_tags(r'c:\Users\zuoyi\Desktop\交配\mvp-algebra-fixed\src\components\DynamicScaffold.tsx')
