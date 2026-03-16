export interface ReferenceAnswer {
  fingerprint: string;
  label: string;
  questionType: 'Q18' | 'Q24' | 'Q25';
  source: string;
  correctAnswers: string;
  stepHints: Array<{ goal: string; expectedAnswer: string }>;
}

export function findReferenceAnswer(problemText: string): ReferenceAnswer | null {
  const normalized = problemText.replace(/\s+/g, '');
  for (const ref of REFERENCE_BANK) {
    const keywords = ref.fingerprint.split('|');
    const matchCount = keywords.filter(kw => normalized.includes(kw.replace(/\s+/g, ''))).length;
    if (matchCount >= Math.ceil(keywords.length * 0.6)) {
      return ref;
    }
  }
  return null;
}

const REFERENCE_BANK: ReferenceAnswer[] = [
  {
    fingerprint: 'y=ax²−2x+c|y=−x+3|分别交于x轴、y轴|顶点为点D|tan∠BCD|∠PEB=∠BCD',
    label: '2022浦东Q24: 抛物线y=ax²-2x+c与直线y=-x+3',
    questionType: 'Q24',
    source: '2022年上海市浦东新区中考数学二模试题',
    correctAnswers: `已知正确答案:
- C(0,3), B(6,0)
- a=1/4, c=3
- D(4,-1)
- E(3,0)
- tan∠BCD=1/3
- P(9/4,3/4) 或 P(12,-3)`,
    stepHints: [
      { goal: '求直线y=-x+3与坐标轴的交点B、C', expectedAnswer: 'B(6,0), C(0,3)' },
      { goal: '将B、C代入抛物线求a和c的值', expectedAnswer: 'a=1/4, c=3' },
      { goal: '写出抛物线解析式并配方', expectedAnswer: 'y=(1/4)x²-2x+3=(1/4)(x-4)²-1' },
      { goal: '求顶点D的坐标', expectedAnswer: 'D(4,-1)' },
      { goal: '求CD与x轴的交点E', expectedAnswer: 'E(3,0)' },
      { goal: '求tan∠BCD的值', expectedAnswer: 'tan∠BCD=1/3' },
      { goal: '求点P的坐标(P在x轴上方的情况)', expectedAnswer: 'P(9/4,3/4)' },
      { goal: '求点P的坐标(P在x轴下方的情况)', expectedAnswer: 'P(12,-3)' },
    ],
  },
  {
    fingerprint: 'y＝﹣x²+mx+n|A（5，0）|对称轴为直线x＝3|△BOE的面积为3|BD＝EO|∠DAO的余切值',
    label: '2022黄浦Q24: y=-x²+mx+n, A(5,0), 对称轴x=3',
    questionType: 'Q24',
    source: '2022年上海市黄浦区中考二模数学试卷',
    correctAnswers: `(1) 抛物线表达式: y=-x²+6x-5
(2) B(3,4), E(3,2), 直线 y=-x+5
(3) D(0,2) 时 cot∠DAO=5/2; D'(0,6) 时 cot∠D'AO=5/6`,
    stepHints: [
      { goal: '求抛物线表达式', expectedAnswer: 'y=-x²+6x-5' },
      { goal: '求顶点B坐标', expectedAnswer: 'B(3,4)' },
      { goal: '求点E坐标(△BOE面积=3)', expectedAnswer: 'E(3,2)' },
      { goal: '求直线y=kx+b的表达式', expectedAnswer: 'y=-x+5' },
      { goal: '求D坐标(情况1: BD∥OE)', expectedAnswer: 'D(0,2), cot∠DAO=5/2' },
      { goal: '求D坐标(情况2: BD不平行OE)', expectedAnswer: "D'(0,6), cot∠D'AO=5/6" },
    ],
  },
  {
    fingerprint: 'Rt△ABC|∠ACB=90°|BC=2|AC=3|以点C为圆心、CB为半径|AE∥CD|△ACQ∽△CPQ',
    label: '2022浦东Q25: Rt△ABC, BC=2, AC=3, ⊙C',
    questionType: 'Q25',
    source: '2022年上海市浦东新区中考数学二模试题',
    correctAnswers: `(1) CE = 5/4
(2) ① CP = 36/5
② CP = (20+4√10)/15`,
    stepHints: [
      { goal: '求CE的长(利用AE∥CD和勾股定理)', expectedAnswer: 'CE=5/4' },
      { goal: '由△ACQ∽△CPQ推导△ACE∽△PCA', expectedAnswer: '∠ACQ=∠P, △ACE∽△PCA' },
      { goal: '由相似比求CP的值', expectedAnswer: 'CP=36/5' },
      { goal: '建立坐标系求AQ关于CP的表达式', expectedAnswer: 'AQ=15√(t²+9)/(12t-15)' },
      { goal: '由两圆相切条件列方程求CP', expectedAnswer: 'CP=(20+4√10)/15' },
    ],
  },
  {
    fingerprint: '四个白色全等直角三角形|四个黑色全等三角形|风车|∠ABO＝90°|OB＝3|AB＝4|A、E、D在同一直线上|OE',
    label: '2022徐汇Q18: 风车型直角三角形, OB=3, AB=4',
    questionType: 'Q18',
    source: '2022年上海市徐汇区中考二模数学试题',
    correctAnswers: `OE = 45/37
A(-4,-3), B(0,-3), C(3,-4), D(3,0)
E(27/37, -36/37)`,
    stepHints: [
      { goal: '建立坐标系并确定各点坐标', expectedAnswer: 'A(-4,-3), B(0,-3), C(3,-4), D(3,0)' },
      { goal: '求直线AD的解析式', expectedAnswer: 'y=(3/7)x-9/7' },
      { goal: '求直线OC的解析式', expectedAnswer: 'y=(-4/3)x' },
      { goal: '联立求E坐标并计算OE', expectedAnswer: 'E(27/37,-36/37), OE=45/37' },
    ],
  },
  {
    fingerprint: '之间的距离是5cm|圆心O到直线的距离是2cm|圆O与直线|有三个公共点',
    label: '2022虹口Q18: 圆O与两平行直线',
    questionType: 'Q18',
    source: '2022年上海虹口区中考二模数学卷',
    correctAnswers: `r=3或r=7`,
    stepHints: [
      { goal: '分析圆心O与两直线的位置关系', expectedAnswer: 'O到l₁距离2cm, l₁l₂间距5cm' },
      { goal: '情况1: O在两直线之间, 求r', expectedAnswer: 'O到l₂距离=3, r=3' },
      { goal: '情况2: O在两直线同侧, 求r', expectedAnswer: 'O到l₂距离=7, r=7' },
    ],
  },
];

export { REFERENCE_BANK };
