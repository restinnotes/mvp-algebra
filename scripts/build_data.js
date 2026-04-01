const fs = require('fs');
const path = require('path');

const papersDir = path.join(process.cwd(), 'src', 'data', 'papers');
const outputFile = path.join(process.cwd(), 'src', 'data', 'all_papers.json');

const files = fs.readdirSync(papersDir).filter(f => f.endsWith('.json'));
const allData = {};

files.forEach(file => {
  const content = fs.readFileSync(path.join(papersDir, file), 'utf-8');
  allData[file] = JSON.parse(content);
});

fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
console.log('Compiled all papers to all_papers.json');
