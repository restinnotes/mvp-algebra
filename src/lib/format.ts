// 论文/试卷名称精细化汉化映射
export const PAPER_NAME_MAP: Record<string, string> = {
  'Chongming': '崇明',
  'Fengxian': '奉贤',
  'Baoshan': '宝山',
  'Hongkou': '虹口',
  'Huangpu': '黄浦',
  'Pudong': '浦东',
  'Putuo': '普陀',
  'Xuhui': '徐汇',
  'One_Mock': '一模',
  'Two_Mock': '二模',
  'One Mock': '一模',
  'Two Mock': '二模',
  'Mock': '一模' // 默认还原为一模
};

export function formatPaperName(raw: string | null | undefined): string {
  if (!raw || raw.trim() === '') return '通用';
  
  let formatted = raw;
  
  // 1. 优先处理复合词，防止被拆分翻译
  if (/one_?mock/i.test(formatted)) formatted = formatted.replace(/one_?mock/gi, '一模');
  if (/two_?mock/i.test(formatted)) formatted = formatted.replace(/two_?mock/gi, '二模');

  // 2. 依次翻译其他区域词
  Object.entries(PAPER_NAME_MAP).forEach(([en, cn]) => {
    // 如果已经包含了中文的一模/二模，就不再处理 Mock 这个词
    if (en === 'Mock' && (formatted.includes('一模') || formatted.includes('二模'))) {
      return;
    }
    formatted = formatted.replace(new RegExp(en, 'gi'), cn);
  });
  
  // 3. 清理格式：移除下划线，合并多余空格，移除多余的“第 X 题”这种标识（如果存在于卷名中）
  return formatted.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}
