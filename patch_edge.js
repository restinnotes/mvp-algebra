const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/calculate/route.ts',
  'src/app/api/decompose/route.ts',
  'src/app/api/evaluate-strategy/route.ts',
  'src/app/api/questions/route.ts',
  'src/app/api/recognize/route.ts',
  'src/app/api/review/route.ts',
  'src/app/api/session/route.ts',
  'src/app/api/summarize-persona/route.ts',
  'src/app/page.tsx',
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('export const runtime = "edge";')) {
    content = 'export const runtime = "edge";\n' + content;
    fs.writeFileSync(filePath, content);
  }
}
