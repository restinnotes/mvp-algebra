import fs from 'fs';
import path from 'path';

const MD_PATH = 'consolidated_surgical.md';
const JSON_PATH = 'mappings_auto.json';

function normalizeId(id) {
    return id.toLowerCase().replace(/_/g, '').trim();
}

async function run() {
    const md = fs.readFileSync(MD_PATH, 'utf8');
    const questions = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

    // Improved Parser
    // Sections look like: ### Question 18\n 18. [Text]
    const sections = md.split(/### Question \d+/);
    
    // Attempt to match paper + question
    // File: .\2022\2022年上海市徐汇区中考二模数学试题（含解析）.docx
    const fileSplit = md.split(/## File: /);
    const contentMap = {}; // key: "paper_q", value: text

    fileSplit.slice(1).forEach(fileBlock => {
        const lines = fileBlock.split('\n');
        const fileNameLine = lines[0];
        // Extract district and paper type
        // 2022年上海市[徐汇]区中考[二模]数学试题
        const districtMatch = fileNameLine.match(/上海市([^区]+)区/);
        const typeMatch = fileNameLine.match(/(一模|二模)/);
        
        if (!districtMatch || !typeMatch) return;
        
        const district = districtMatch[1].trim();
        const type = typeMatch[1].trim();
        const year = "2022"; // Hardcoded prefix based on folder
        
        // Find individual questions in this file block
        const qBlocks = fileBlock.split(/### Question /);
        qBlocks.slice(1).forEach(qBlock => {
            const qMatch = qBlock.match(/^(\d+)/);
            if (!qMatch) return;
            const qNum = qMatch[1];
            
            // The content starts after "XX. " in the block
            const cleanContent = qBlock.split('\n')
                .filter(l => l.trim() && !l.startsWith('!') && !l.startsWith('###') && !l.includes('【答案】') && !l.includes('【解析】'))
                .map(l => l.replace(/^\d+\.\s*/, '').trim()) // remove "18. " etc
                .join('\n')
                .split('三、解答题')[0] // Stop at header
                .trim();

            const key = `${year}_${district}_${type}_${qNum}`; // e.g. 2022_徐汇_二模_18
            contentMap[key] = cleanContent;
            console.log(`Extracted: ${key} (${cleanContent.substring(0, 20)}...)`);
        });
    });

    // Merge into JSON
    const updated = questions.map(q => {
        const typeMap = { "一模": "One_Mock", "二模": "Two_Mock" };
        const districtEn = {
            "徐汇": "Xuhui", "浦东": "Pudong", "虹口": "Hongkou", "静安": "Jingan", 
            "普陀": "Putuo", "长宁": "Changning", "闵行": "Minhang", "杨浦": "Yangpu",
            "黄浦": "Huangpu", "青浦": "Qingpu", "奉贤": "Fengxian", "金山": "Jinshan",
            "松江": "Songjiang", "嘉定": "Jiading", "宝山": "Baoshan", "崇明": "Chongming"
        };
        
        const districtMap = {};
        Object.entries(districtEn).forEach(([zh, en]) => districtMap[en] = zh);
        
        // Construction: 2022_徐汇_二模_18
        const zhDistrict = q.district; // Actually it's already in Chinese in mappings_auto.json
        const zhType = q.exam_type;
        const key = `2022_${zhDistrict}_${zhType}_${q.question}`;
        
        if (contentMap[key]) {
            return { ...q, content: contentMap[key] };
        }
        return q;
    });

    fs.writeFileSync(JSON_PATH, JSON.stringify(updated, null, 2));
    console.log("Successfully updated mappings_auto.json");
}

run();
