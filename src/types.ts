export interface ReferenceImage {
  id: string;
  name: string;
  dataUrl: string;
  isMatted?: boolean; // 是否已抠图去背景
  mattedDataUrl?: string; // 抠图后的透明底图像
  role: 'product' | 'chart' | 'style' | 'general';
}

export interface PostCopy {
  titles: [string, string, string]; // 3套爆款标题：[痛点反差型, 深度测评型, 干货清单型]
  selectedTitleIndex: number;
  body: string;
  tags: string[];
}

export type CardType = 
  | 'cover'        // 封面卡
  | 'comparison'   // 对比表卡
  | 'detail'       // 细节拆解卡
  | 'verdict'      // 红黑榜决策卡
  | 'outro'        // 互动结语卡
  | 'radar'        // 五维雷达图卡
  | 'ingredient'   // 美妆成分分析卡
  | 'quote';       // 知识金句拆书卡

export interface ComparisonRow {
  metric: string;
  valA: string;
  valB: string;
  highlight?: 'A' | 'B' | 'none';
}

export interface DetailPoint {
  tag: string;
  title: string;
  content: string;
}

// 雷达图数据项
export interface RadarAxis {
  label: string; // 维度名称 (如: 性能、续航、手感、拍照、性价比)
  value: number; // 0 - 100
  note?: string;
}

// 成分分析项
export interface IngredientItem {
  name: string;
  role: string;      // 功效 (如: 核心美白、强效保湿、抗氧舒缓)
  safety: 'safe' | 'caution' | 'warning'; // 🟢 绿色安全 / 🟡 慎用 / 🔴 警惕
  score: number;     // 1 - 5 星安全度
}

export interface CardModel {
  id: string;
  type: CardType;
  pageNum: number;
  totalPages: number;
  theme: string;
  badge: string;
  title: string;
  subtitle?: string;
  heroImage?: string; // 实拍图或抠图后透明图
  useMattedImage?: boolean; // 是否启用去背景

  // 1. Comparison specifics
  comparison?: {
    colA: string;
    colB: string;
    rows: ComparisonRow[];
  };

  // 2. Detail specifics
  detail?: {
    alert?: {
      type: 'tip' | 'warning' | 'star';
      text: string;
    };
    points: DetailPoint[];
  };

  // 3. Verdict specifics
  verdict?: {
    overallScore: number;
    pros: string[];
    cons: string[];
    recommendWho: string;
    avoidWho: string;
  };

  // 4. Outro specifics
  outro?: {
    checklist: string[];
    ctaText: string;
    interactionQuestion: string;
  };

  // 5. Radar specifics (新垂类：五维雷达图)
  radar?: {
    axes: RadarAxis[];
    summary: string;
    score: number;
  };

  // 6. Ingredient specifics (新垂类：美妆成分分析)
  ingredient?: {
    targetSkin: string; // 适用肤质 (如: 混合油皮、敏感肌慎入)
    items: IngredientItem[];
    verdict: string;
  };

  // 7. Quote specifics (新垂类：读书金句/思维模型)
  quote?: {
    goldenQuote: string;
    author: string;
    bookTitle: string;
    threeLevels: [string, string, string]; // [底层逻辑, 驱动机制, 落地行动]
  };

  footerAuthor?: string;
}

export type CategoryPreset = 'tech' | 'knowledge' | 'review' | 'tutorial' | 'skincare';

export interface GenerationConfig {
  topic: string;
  details: string;
  category: CategoryPreset;
  theme: string;
  cardCount: number;
  authorName: string;
  selectedImageId?: string;
  apiKey?: string;
  apiBaseUrl?: string;
  modelName?: string;
}
