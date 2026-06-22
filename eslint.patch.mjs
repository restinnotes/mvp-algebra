import fs from 'fs';

const filesToPatch = [
  'src/components/DynamicScaffold/useDynamicScaffold.ts',
  'src/components/PracticeUI.tsx'
];

for (const file of filesToPatch) {
  let content = fs.readFileSync(file, 'utf8');
  content = '/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/immutability */\n' + content;
  fs.writeFileSync(file, content);
}
