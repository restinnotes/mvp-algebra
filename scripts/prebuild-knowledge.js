const fs = require('fs');
const path = require('path');

const KP_PATH = path.join(process.cwd(), 'knowledge_points.json');
const PAPERS_DIR = path.join(process.cwd(), 'src', 'data', 'papers');

function build() {
  // Read graph
  const rawGraph = fs.readFileSync(KP_PATH, 'utf-8');

  // Read mappings
  const files = fs.readdirSync(PAPERS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  const allMappings = [];

  for (const file of jsonFiles) {
    const raw = fs.readFileSync(path.join(PAPERS_DIR, file), 'utf-8');
    const data = JSON.parse(raw);
    const qs = Array.isArray(data) ? data : [data];

    const yearMatch = file.match(/^(\d{4})/);
    const fileYear = yearMatch ? yearMatch[1] : '2022';

    const processedQs = qs.map(q => {
      const questionNum = q.question || q.questionNumber || q.qNumber || q.question_type?.replace(/^Q/, '') || '';
      let kps = q.kps || [];
      if (typeof kps === 'string') {
        kps = kps.split(',').map(k => k.trim());
      } else if (!Array.isArray(kps)) {
        kps = [];
      }

      const difficulty = q.difficulty || 0.5;
      const discrimination = q.discrimination || 0.5;
      const guess = q.guess || 0.2;

      const paperName = file.replace('.json', '');
      let district = q.district || '';
      if (!district || district === 'all') {
        const parts = file.split('_');
        if (parts.length > 1) district = parts[1];
      }

      let examType = q.exam_type || '';
      if (!examType) {
          if (file.includes('One_Mock')) examType = '一模';
          else if (file.includes('Two_Mock')) examType = '二模';
      }

      return {
        ...q,
        paper: q.paper || file.replace('.json', ''),
        district: district,
        year: q.year || fileYear,
        exam_type: examType,
        question: String(questionNum),
        kps: kps,
        difficulty: difficulty,
        discrimination: discrimination,
        guess: guess
      };
    });

    const validQs = processedQs.filter(q => (q.kps && q.kps.length > 0) || (q.tags && q.tags.length > 0));
    allMappings.push(...validQs);
  }

  const content = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
export const _graphCache = ${rawGraph};
export const _mappingsCache = ${JSON.stringify(allMappings, null, 2)};
`;

  fs.writeFileSync(path.join(process.cwd(), 'src', 'lib', 'knowledge_data.ts'), content);
}

build();
