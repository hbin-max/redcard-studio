import type { CardModel, CardType, GenerationConfig, PostCopy, ReferenceImage } from '../types';
import { completionResponse, onlineDeck } from './onlineSchema.ts';

type GenerationResult = { copy: PostCopy; cards: CardModel[]; notice?: string };
let nextCardNumber = 0;

export function newCardId() {
  return `card-${++nextCardNumber}`;
}

export function referenceImageSource(image?: ReferenceImage) {
  return image?.isMatted && image.mattedDataUrl ? image.mattedDataUrl : image?.dataUrl;
}

function getReferenceImage(config: GenerationConfig, images: ReferenceImage[]) {
  return images.find(image => image.id === config.selectedImageId) ?? images[0];
}

function fallbackNotice(error: unknown) {
  if (error instanceof DOMException && error.name === 'TimeoutError') return '模型请求超时，已使用本地模板。';
  if (error instanceof Error && /^HTTP \d+$/.test(error.message)) return `在线生成失败（${error.message}），已使用本地模板。`;
  if (error instanceof TypeError) return '无法连接模型接口，请检查接口地址和网络。已使用本地模板。';
  return '模型返回的数据无法读取，已使用本地模板。';
}

/**
 * 智能小红书文案与卡片生成器
 * 支持在线多模态大模型与本地智能引擎
 */
export async function generateXiaohongshuContent(
  config: GenerationConfig,
  referenceImages: ReferenceImage[]
): Promise<GenerationResult> {
  const offline = generateOfflineSmartContent(config, referenceImages);
  if (config.apiKey?.trim()) {
    try {
      return await callOnlineLLM(config, referenceImages, offline.cards.map(card => card.type));
    } catch (error) {
      return { ...offline, notice: fallbackNotice(error) };
    }
  }
  return offline;
}

/**
 * 单页局部独立重新生成 (Deck Orchestrator Single-Page Regen)
 * 仅刷新特定页面的数据，保持其余页面与全局文案完全不变
 */
export async function regenerateSingleCard(
  card: CardModel,
  config: GenerationConfig,
  referenceImages: ReferenceImage[]
): Promise<{ card: CardModel; notice?: string }> {
  let notice: string | undefined;
  let replacement: CardModel | undefined;
  if (config.apiKey?.trim()) {
    try {
      replacement = (await callOnlineLLM(config, referenceImages, [card.type], card.title)).cards[0];
    } catch (error) {
      notice = fallbackNotice(error);
    }
  }

  if (!replacement) {
    const matches = generateOfflineSmartContent(config, referenceImages).cards.filter(item => item.type === card.type);
    replacement = matches.find(item => item.pageNum === card.pageNum) ?? matches[0]
      ?? createNewCardTemplate(card.type, card.pageNum - 1, config, card.heroImage);
  }

  return { card: { ...replacement, id: card.id, pageNum: card.pageNum, totalPages: card.totalPages }, notice };
}

/**
 * 创建空白/指定类型的全新卡片模板
 */
export function createNewCardTemplate(
  type: CardType,
  totalCount: number,
  config: GenerationConfig,
  referenceImage?: string
): CardModel {
  const pageNum = totalCount + 1;
  const author = config.authorName || '测评研究所';
  const theme = config.theme;
  const baseId = newCardId();

  switch (type) {
    case 'radar':
      return {
        id: baseId,
        type: 'radar',
        pageNum,
        totalPages: pageNum,
        theme,
        badge: '五维硬核评分',
        title: '多维度实测综合表现',
        radar: {
          score: 9.3,
          summary: '综合能效比与手感极为突出，无明显短板，综合推荐指数五颗星！',
          axes: [
            { label: '核心性能', value: 92, note: '92分' },
            { label: '续航温控', value: 96, note: '96分' },
            { label: '屏幕素质', value: 90, note: '90分' },
            { label: '质感做工', value: 94, note: '94分' },
            { label: '入手性价比', value: 85, note: '85分' }
          ]
        },
        footerAuthor: `@${author}`
      };

    case 'ingredient':
      return {
        id: baseId,
        type: 'ingredient',
        pageNum,
        totalPages: pageNum,
        theme,
        badge: '成分深度拆解',
        title: '核心活性物与安全红黑榜',
        ingredient: {
          targetSkin: '适用于混合油皮、耐受型肌肤；重度敏感肌建议先耳后试敏',
          verdict: '配方精炼克制，无酒精色素，核心活性物浓度足，值得一试！',
          items: [
            { name: '高纯度玻色因', role: '充盈紧致、修护肌底', safety: 'safe', score: 5 },
            { name: '乙酰基六肽-8', role: '淡化动态细纹、抗表情纹', safety: 'safe', score: 5 },
            { name: '微量植物提取香精', role: '气味调和剂', safety: 'caution', score: 3 },
            { name: '低敏多元醇防腐体系', role: '温和体系，替代传统防腐', safety: 'safe', score: 4 }
          ]
        },
        footerAuthor: `@${author}`
      };

    case 'quote':
      return {
        id: baseId,
        type: 'quote',
        pageNum,
        totalPages: pageNum,
        theme,
        badge: '深度认知金句',
        title: '核心底层思维模型',
        quote: {
          bookTitle: '深度认知录',
          author: '经典认知学派',
          goldenQuote: '“很多时候你所认为的极限，不过是现有认知体系投射出的虚假天花板。”',
          threeLevels: [
            '底层认知：跳出单一结果归因，看清系统动态反馈',
            '驱动机制：通过微小高频正向反馈，瓦解惯性阻力',
            '落地行动：设立每日不可抗拒的 MVP 最小动作'
          ]
        },
        footerAuthor: `@${author}`
      };

    case 'comparison':
      return {
        id: baseId,
        type: 'comparison',
        pageNum,
        totalPages: pageNum,
        theme,
        badge: '深度横向对比',
        title: '核心指标参数两两PK',
        comparison: {
          colA: '主推旗舰款',
          colB: '对比竞品款',
          rows: [
            { metric: '主力优势', valA: '业内标杆表现', valB: '常规普通水平', highlight: 'A' },
            { metric: '使用寿命', valA: '至少 3-4 年不卡', valB: '约 1-2 年需维护', highlight: 'A' },
            { metric: '日常体验', valA: '温润舒适无负担', valB: '偶有发热需等待', highlight: 'A' },
            { metric: '性价比', valA: '首发物有所值', valB: '需等大幅跳水', highlight: 'A' }
          ]
        },
        footerAuthor: `@${author}`
      };

    case 'detail':
      return {
        id: baseId,
        type: 'detail',
        pageNum,
        totalPages: pageNum,
        theme,
        badge: '关键要点拆解',
        title: '必须注意的核心细节',
        detail: {
          alert: { type: 'tip', text: '划重点：合理规划使用场景，避免盲目选购冗余配置！' },
          points: [
            { tag: '体验要点 1', title: '日常顺手度与操作效率', content: '设计符合人体工学，单手即可轻松驾驭大部分核心功能。' },
            { tag: '体验要点 2', title: '长期维护成本与周边兼容', content: '配件生态丰富，通用性强，后期几乎没有额外隐形开销。' }
          ]
        },
        footerAuthor: `@${author}`
      };

    case 'verdict':
      return {
        id: baseId,
        type: 'verdict',
        pageNum,
        totalPages: pageNum,
        theme,
        badge: '选购决策指南',
        title: '适合谁买 / 谁千万别碰',
        verdict: {
          overallScore: 9.1,
          pros: ['综合体验稳定成熟', '保值率与口碑稳居第一梯队'],
          cons: ['升级幅度相对克制'],
          recommendWho: '追求省心耐用、看重生态协同的理性用户',
          avoidWho: '追求激进黑科技、极度看重低价换机周期的尝鲜党'
        },
        footerAuthor: `@${author}`
      };

    case 'outro':
      return {
        id: baseId,
        type: 'outro',
        pageNum,
        totalPages: pageNum,
        theme,
        badge: '课代表总结',
        title: '行动清单与互动',
        outro: {
          checklist: ['回顾本篇要点', '选一条适合自己的建议开始实践'],
          ctaText: '觉得有帮助，可以点赞收藏！',
          interactionQuestion: '你还想了解哪些细节？',
        },
        footerAuthor: `@${author}`,
      };

    case 'cover':
      return {
        id: baseId,
        type: 'cover',
        pageNum,
        totalPages: pageNum,
        theme,
        badge: '重点深度精选',
        title: config.topic || '爆款精选主题卡片',
        subtitle: '干货拉满！自用测评总结与避坑选购全指南',
        heroImage: referenceImage,
        footerAuthor: `@${author}`
      };
  }
}

/**
 * 在线大模型调用
 */
async function callOnlineLLM(
  config: GenerationConfig,
  referenceImages: ReferenceImage[],
  cardTypes: CardType[],
  previousTitle?: string
): Promise<GenerationResult> {
  const baseUrl = config.apiBaseUrl?.trim() || 'https://api.openai.com/v1';
  const endpoint = new URL(baseUrl);
  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
    throw new TypeError('模型接口地址无效');
  }
  const endpointPath = endpoint.pathname.replace(/\/+$/, '');
  endpoint.pathname = endpointPath.endsWith('/chat/completions') ? endpointPath : `${endpointPath}/chat/completions`;
  const isDeepSeek = endpoint.hostname === 'api.deepseek.com';
  const model = config.modelName?.trim() || (isDeepSeek ? 'deepseek-flash' : 'gpt-4o-mini');

  const selectedImg = getReferenceImage(config, referenceImages);
  const heroImageSrc = referenceImageSource(selectedImg);

  const systemPrompt = `你是一个深谙小红书算法与审美的爆款内容与排版设计专家。
你的任务是将用户的需求和参考图片转换为：
1. 吸引人点击的高爆款小红书文案（包含3个不同维度的标题、带emoji分段的正文、热门标签）；
2. ${cardTypes.length} 张适合 3:4 画幅的卡片，cards 必须按此顺序输出类型：${cardTypes.join('、')}。
只输出所需的卡片类型。每张卡片文字简短，正文与卡片只使用用户提供的事实，缺少实测资料时用明确的示例或待补充表述，不编造测试成绩、成分功效或原著引文。
${previousTitle ? `这是一次单页重写。围绕原卡片标题「${previousTitle}」重写这一页，仍返回 copy 和单张 cards。` : ''}

必须严格按照以下 JSON 格式输出，不要有任何多余文字：
{
  "copy": {
    "titles": ["痛点反差标题", "深度测评标题", "干货清单标题"],
    "selectedTitleIndex": 0,
    "body": "完整笔记正文，带emoji、分段与空行...",
    "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
  },
  "cards": [
    {
      "type": "cover",
      "badge": "自费测评 / 避坑指南",
      "title": "主标题大字（10-18字）",
      "subtitle": "副标题/痛点金句"
    },
    {
      "type": "comparison",
      "badge": "两代参数对决",
      "title": "核心关键点直观PK",
      "comparison": {
        "colA": "选手A",
        "colB": "选手B",
        "rows": [
          {"metric": "核心参数1", "valA": "表现A", "valB": "表现B", "highlight": "A"},
          {"metric": "核心参数2", "valA": "表现A", "valB": "表现B", "highlight": "B"}
        ]
      }
    },
    {
      "type": "detail",
      "badge": "深度拆解",
      "title": "三大不能忽视的真相",
      "detail": {
        "alert": {"type": "warning", "text": "最致命的避坑警告内容"},
        "points": [
          {"tag": "体验1", "title": "要点标题", "content": "具体描述"},
          {"tag": "体验2", "title": "要点标题", "content": "具体描述"}
        ]
      }
    },
    {
      "type": "verdict",
      "badge": "选购决策",
      "title": "抄作业！到底该怎么选？",
      "verdict": {
        "overallScore": 9.1,
        "pros": ["优势1", "优势2"],
        "cons": ["短板1", "短板2"],
        "recommendWho": "明确推荐的人群特征",
        "avoidWho": "强烈劝退的人群特征"
      }
    },
    {
      "type": "outro",
      "badge": "结语互动",
      "title": "总结与课代表划重点",
      "outro": {
        "checklist": ["重点1", "重点2", "重点3"],
        "ctaText": "觉得有用请点赞收藏，防走丢！",
        "interactionQuestion": "大家觉得这款怎么样？评论区聊聊！"
      }
    }
  ]
}
如果需要其他类型，使用以下结构（示例数据仅描述字段）：
- radar: {"type":"radar","badge":"评分维度","title":"参考评分","radar":{"score":0,"summary":"待核对实测数据","axes":[{"label":"维度名","value":0}]}}，axes 必须包含五项，value 为 0–100。
- ingredient: {"type":"ingredient","badge":"成分","title":"成分核对","ingredient":{"targetSkin":"待确认","items":[{"name":"成分名","role":"待确认","safety":"caution","score":1}],"verdict":"以成分表为准"}}，safety 取 safe/caution/warning，score 取 1–5。
- quote: {"type":"quote","badge":"阅读","title":"阅读心得","quote":{"goldenQuote":"待补充出处","author":"待确认","bookTitle":"书名","threeLevels":["第一层","第二层","第三层"]}}。`;

  const userText = `用户需求主题：${config.topic}
详细说明：${config.details}
卡片分类：${config.category}
署名作者：${config.authorName}`;
  const userContent = selectedImg ? [
    { type: 'text', text: userText },
    { type: 'image_url', image_url: { url: selectedImg.dataUrl } },
  ] : userText;

  const response = await fetch(endpoint, {
    method: 'POST',
    signal: AbortSignal.timeout(60_000),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey?.trim() || ''}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      ...(isDeepSeek ? { thinking: { type: 'disabled' } } : {}),
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = completionResponse.parse(await response.json());
  const value: unknown = JSON.parse(data.choices[0].message.content);
  const parsed = onlineDeck.parse(value);
  const validatedCards = parsed.cards;
  if (validatedCards.length !== cardTypes.length || validatedCards.some((card, index) => card.type !== cardTypes[index])) {
    throw new Error('模型返回的卡片类型或页数有误');
  }

  const cards: CardModel[] = validatedCards.map((card, idx) => ({
    ...card,
    id: newCardId(),
    pageNum: idx + 1,
    totalPages: parsed.cards.length,
    theme: config.theme,
    heroImage: card.type === 'cover' ? heroImageSrc : undefined,
    heroReferenceId: card.type === 'cover' ? selectedImg?.id : undefined,
    footerAuthor: `@${config.authorName}`
  }));

  return { copy: { ...parsed.copy, selectedTitleIndex: 0 }, cards };
}

/**
 * 本地智能离线引擎
 */
function generateOfflineSmartContent(
  config: GenerationConfig,
  referenceImages: ReferenceImage[]
): { copy: PostCopy; cards: CardModel[] } {
  const rawTopic = config.topic.trim() || '深度横评与选购避坑指南';
  const cleanTopic = rawTopic.replace(/(深度拆解|深度测评|避坑指南|保姆级攻略|真香好物|深度横评|选购指南)+$/g, '').trim() || rawTopic;
  const topic = rawTopic;
  const author = config.authorName || '测评研究所';
  
  const selectedImg = getReferenceImage(config, referenceImages);
  const heroImg = referenceImageSource(selectedImg);

  const isTech = config.category === 'tech';
  const isKnowledge = config.category === 'knowledge';
  const isSkincare = config.category === 'skincare';

  let titles: [string, string, string];
  let body: string;
  let tags: string[];
  let cards: CardModel[] = [];

  if (isSkincare) {
    titles = [
      `🧪成分党狂喜！关于${cleanTopic}，看这篇就全懂了`,
      `🚨不吹不黑！${cleanTopic} 核心活性物与安全避雷清单`,
      `💡敏感肌必看！${cleanTopic} 配方深扒与真实测评`
    ];

    body = `今天化身成分党课代表，把近期大热的【${topic}】配方表扒了个底朝天！🔬
到底是不是营销噱头？适不适合敏肌和油皮？直接上硬核拆解！

🧴 核心配方亮点：
1️⃣ 核心活性物诚意满满，主攻深层修护抗氧。
2️⃣ 防腐与促渗体系克制温和，减少肌肤额外负担。
3️⃣ 肤感轻盈易推开，吸收后不闷不黏。

⚠️ 避坑提醒：
如果是重度屏障受损肌，初次使用建议先建立耐受，切勿跟风厚涂。

详细的成分安全信号灯与多维度打分都在图里了，向左滑动即可查阅高清卡片👉 记得点赞收藏随时查阅！`;

    tags = ['#成分党', '#护肤测评', '#敏肌修护', '#成分分析', '#好物避坑'];

    cards = [
      {
        id: 'card-1',
        type: 'cover',
        pageNum: 1,
        totalPages: 5,
        theme: config.theme,
        badge: '成分硬核解析',
        title: topic,
        subtitle: '不吹不黑！自费深扒配方表，敏感肌油皮买前必看',
        heroImage: heroImg,
        footerAuthor: `@${author}`
      },
      {
        id: 'card-2',
        type: 'ingredient',
        pageNum: 2,
        totalPages: 5,
        theme: config.theme,
        badge: '成分安全信号灯',
        title: '核心活性物与防腐体系',
        ingredient: {
          targetSkin: '适用于中性、干性及混合肌；换季敏感期建议先耳后试敏',
          verdict: '配方精炼无多余香精色素，活性物添加足量，兼顾温和与功效！',
          items: [
            { name: '高活性玻色因 (Pro-Xylane)', role: '紧致充盈、丰盈淡纹', safety: 'safe', score: 5 },
            { name: '积雪草精萃提取物', role: '舒缓敏红、强韧屏障', safety: 'safe', score: 5 },
            { name: '低敏角鲨烷', role: '仿生皮脂、锁水保湿', safety: 'safe', score: 5 },
            { name: '微量植物精油防腐体系', role: '安全抑菌调香', safety: 'caution', score: 3 }
          ]
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-3',
        type: 'radar',
        pageNum: 3,
        totalPages: 5,
        theme: config.theme,
        badge: '五维实测评分',
        title: '护肤综合体验雷达图',
        radar: {
          score: 9.4,
          summary: '温和度与修护力表现优异，肤感清爽不油腻，综合表现亮眼！',
          axes: [
            { label: '温和低敏', value: 95, note: '95分' },
            { label: '淡纹紧致', value: 88, note: '88分' },
            { label: '长效保湿', value: 94, note: '94分' },
            { label: '肤感吸收', value: 92, note: '92分' },
            { label: '性价比', value: 86, note: '86分' }
          ]
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-4',
        type: 'verdict',
        pageNum: 4,
        totalPages: 5,
        theme: config.theme,
        badge: '选购红黑对照表',
        title: '到底适合谁？抄作业清单',
        verdict: {
          overallScore: 9.2,
          pros: ['配方干净，修护退红迅速', '水润好推开，晨间妆前不搓泥', '无致痘致敏高危成分'],
          cons: ['大容量正装单价稍贵', '开封后需 6 个月内用完'],
          recommendWho: '有淡纹修护需求、追求温和高效的熟龄与熬夜党',
          avoidWho: '追求立竿见影猛药酸类、预算极其敏感的尝鲜学生党'
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-5',
        type: 'outro',
        pageNum: 5,
        totalPages: 5,
        theme: config.theme,
        badge: '课代表总结',
        title: '理性护肤，适合自己才最香',
        outro: {
          checklist: [
            '购买前先看清配方表，不盲从大促跟风',
            '敏感肌上脸前务必在耳后或手腕内侧测试',
            '护肤品贵在坚持使用，给皮肤 28 天代谢周期'
          ],
          ctaText: '点赞收藏防走丢，随时拿出来对照成分表！❤️',
          interactionQuestion: '你平时最看重护肤品里的哪个成分？评论区来交流！'
        },
        footerAuthor: `@${author}`
      }
    ];
  } else if (isTech) {
    titles = [
      `🚨自费一个月！${cleanTopic} 真相曝光，劝退还是真香？`,
      `🔥两代深度对决：${cleanTopic} 买前必看的避坑指南`,
      `💡拒绝智商税！${cleanTopic} 核心优缺点与终极选购清单`
    ];

    body = `耗时一个月深度体验，终于把【${topic}】给整明白了！😭
很多朋友私信问到底值不值得入手？今天不吹不黑，直接上全网最真实的干货对比！

📌 先说结论：
如果你在意日常续航和发热表现，体验确实有明显质感提升；但如果预算吃紧，旧款依然是性价比首选。

📊 核心亮点与痛点拆解：
1️⃣ 核心性能：日常流畅度拉满，高负载场景调度温控稳健。
2️⃣ 痛点吐槽：充电速度依旧保守，部分高刷生态适配还需等待优化。
3️⃣ 屏幕与握持：手感轻盈圆润，单手操作压力明显降低。

🎯 到底怎么选？
✅ 闭眼入人群：手持两年前旧机型、预算充足、对拍照与能效比有极致追求的同学。
❌ 建议观望：刚刚入手上一代机型、日常仅轻度刷剧办公的同学，完全没必要冲动换机！

具体参数对比和红黑榜我都做在图里了，滑动即可查阅高清卡片👉 记得点赞收藏防走丢！`;

    tags = ['#数码测评', '#深度横评', '#数码好物', '#避坑指南', '#真香好物'];

    cards = [
      {
        id: 'card-1',
        type: 'cover',
        pageNum: 1,
        totalPages: 5,
        theme: config.theme,
        badge: '自费真实测评',
        title: topic,
        subtitle: '不吹不黑！自用一个月，这三个缺点导购绝不告诉你',
        heroImage: heroImg,
        footerAuthor: `@${author}`
      },
      {
        id: 'card-2',
        type: 'comparison',
        pageNum: 2,
        totalPages: 5,
        theme: config.theme,
        badge: '核心参数直观PK',
        title: '新旧两代 / 竞品关键对决',
        comparison: {
          colA: '全新升级款',
          colB: '上一代经典款',
          rows: [
            { metric: '核心处理器', valA: '新一代能效比巅峰', valB: '够用但高负载发烫', highlight: 'A' },
            { metric: '续航与温控', valA: '重度使用 7.5 小时', valB: '重度使用 5.5 小时', highlight: 'A' },
            { metric: '便携与手感', valA: '边缘微弧，轻盈舒适', valB: '直角边框稍硌手', highlight: 'A' },
            { metric: '入手到手价', valA: '原价首发无优惠', valB: '大促直降 800+ 元', highlight: 'B' }
          ]
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-3',
        type: 'radar',
        pageNum: 3,
        totalPages: 5,
        theme: config.theme,
        badge: '五维硬核雷达',
        title: '全方位实测打分雷达图',
        radar: {
          score: 9.3,
          summary: '屏幕素质与能效比无愧第一梯队，综合表现扎实无短板。',
          axes: [
            { label: '日常性能', value: 95, note: '95分' },
            { label: '续航发热', value: 94, note: '94分' },
            { label: '屏幕素质', value: 92, note: '92分' },
            { label: '影像拍照', value: 90, note: '90分' },
            { label: '快充续命', value: 78, note: '78分' }
          ]
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-4',
        type: 'verdict',
        pageNum: 4,
        totalPages: 5,
        theme: config.theme,
        badge: '选购决策红黑榜',
        title: '综合得分 9.2 分！买前对照表',
        verdict: {
          overallScore: 9.2,
          pros: ['能效比跨越式提升，续航惊喜', '屏幕素质顶尖，护眼策略完善', '保值率与系统支持周期长'],
          cons: ['快充功率依然保守', '原厂配件定价略贵，需自备第三方'],
          recommendWho: '两年前旧机用户 / 追求极佳手感与稳健系统体验的用户',
          avoidWho: '手持上一代次新机 / 追求极致百瓦闪充的用户'
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-5',
        type: 'outro',
        pageNum: 5,
        totalPages: 5,
        theme: config.theme,
        badge: '课代表划重点',
        title: '终极建议：理性消费不盲从',
        outro: {
          checklist: [
            '按需选配储存容量，避免日后空间焦虑',
            '善用平台以旧换新或补贴策略，不要急于原价首发',
            '重点看个人使用痛点，适合自己的才是最好的'
          ],
          ctaText: '码字制作不易，觉得有用请双击点赞收藏！❤️',
          interactionQuestion: '你们目前正在用哪一款？评论区告诉我，帮你看是否值得升级！'
        },
        footerAuthor: `@${author}`
      }
    ];
  } else if (isKnowledge) {
    titles = [
      `🧠狠狠开窍！关于${cleanTopic}，我后悔没早点知道`,
      `📚全网最通俗的${cleanTopic}深度拆解：思维模型速成`,
      `建议反复阅读！普通人如何掌握${cleanTopic}的核心本质`
    ];

    body = `很多人在【${topic}】上踩过太多坑，往往是因为认知底层被蒙蔽了！今天用这套极简卡片，把最核心的逻辑一次性讲透！💡

✨ 核心底层思维：
很多时候我们不是不够努力，而是路径选择错了。把精力集中在产生 80% 收益的核心杠杆点上。

📝 本期精华清单：
1. 认清本质：剥离干扰项，抓住关键驱动因素。
2. 搭建闭环：从输入、内化到输出建立良性反馈。
3. 避坑指南：避免陷入伪勤奋的低水平重复陷阱。

💡 更多干货细节与行动清单请向左滑动查看 5 张高清卡片，建议先收藏再慢慢消化！`;

    tags = ['#认知提升', '#个人成长', '#干货分享', '#思维模型', '#学习笔记'];

    cards = [
      {
        id: 'card-1',
        type: 'cover',
        pageNum: 1,
        totalPages: 5,
        theme: config.theme,
        badge: '认知跃迁精读',
        title: topic,
        subtitle: '打破低效循环！5分钟重塑底层认知的思维工具箱',
        heroImage: heroImg,
        footerAuthor: `@${author}`
      },
      {
        id: 'card-2',
        type: 'quote',
        pageNum: 2,
        totalPages: 5,
        theme: config.theme,
        badge: '认知金句拆解',
        title: '打破认知盲区的核心支点',
        quote: {
          bookTitle: '认知跃迁之道',
          author: '大师精读录',
          goldenQuote: '“不要用战术上的勤奋，来掩盖战略上的懒惰。真正的破局点往往藏在最容易被忽略的底层假设里。”',
          threeLevels: [
            '底层逻辑：凡事多问三个“为什么”，直至找到第一性原理',
            '驱动机制：将抽象宏大目标拆解为可度量的单日行动指标',
            '落地践行：设定每周复盘闭环，不重复在同一坑道跌倒'
          ]
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-3',
        type: 'comparison',
        pageNum: 3,
        totalPages: 5,
        theme: config.theme,
        badge: '认知思维对决',
        title: '高效思维 vs 低效内耗直观对比',
        comparison: {
          colA: '高效成长型思维',
          colB: '低效内耗型思维',
          rows: [
            { metric: '问题切入点', valA: '寻找核心支点与根本解', valB: '头痛医头，流于表面', highlight: 'A' },
            { metric: '精力分配', valA: '聚焦 20% 高杠杆事项', valB: '平均用力，疲于奔命', highlight: 'A' },
            { metric: '对待反馈', valA: '视挫折为迭代数据', valB: '视挫折为否定自身', highlight: 'A' },
            { metric: '长期结果', valA: '指数级复利增长', valB: '低水平重复消耗', highlight: 'A' }
          ]
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-4',
        type: 'verdict',
        pageNum: 4,
        totalPages: 5,
        theme: config.theme,
        badge: '行动自查清单',
        title: '自查对照表：你做到了几条？',
        verdict: {
          overallScore: 9.5,
          pros: ['逻辑清晰，实操性极强', '大幅减少内耗时间', '构建长期可持续的核心竞争力'],
          cons: ['前期需要克服惯性阻力', '需要保持至少 21 天刻意练习'],
          recommendWho: '渴望突破瓶颈、提升单位时间价值的职场人与自学者',
          avoidWho: '只想投机取巧、缺乏基本执行力的伸手党'
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-5',
        type: 'outro',
        pageNum: 5,
        totalPages: 5,
        theme: config.theme,
        badge: '行动召唤',
        title: '种一棵树最好的时间是十年前，其次是现在',
        outro: {
          checklist: [
            '收藏本文，作为每周自查备忘录',
            '今天挑出其中 1 个微小动作立即开始践行',
            '把学到的知识分享给身边同频的朋友'
          ],
          ctaText: '关注我，一起成为更清醒、更有底气的人！✨',
          interactionQuestion: '关于这个话题，你最大的感悟或困惑是什么？留言一起交流！'
        },
        footerAuthor: `@${author}`
      }
    ];
  } else if (config.category === 'tutorial') {
    titles = [`${cleanTopic}｜三步操作指南`, `${cleanTopic}怎么开始？`, `${cleanTopic}的准备与检查清单`];
    const steps = [
      { title: '开始前先做准备', points: ['确定最后要交付的结果', '整理所需工具与资料', '预留一次试做的时间'] },
      { title: '从最小步骤开始', points: ['先完成最简单的一步', '随手记下具体操作', '遇到卡点就退回上一步检查'] },
      { title: '检查结果并复盘', points: ['对照原来的目标验收', '记录哪一步还需要调整', '把可复用的步骤整理成清单'] },
    ];
    body = `🛠️ ${topic}\n\n${steps.map(step => `${step.title}\n${step.points.map(point => `• ${point}`).join('\n')}`).join('\n\n')}`;
    tags = ['#保姆级教程', '#步骤拆解', '#操作清单'];
    cards = [
      { ...createNewCardTemplate('cover', 0, config, heroImg), title: topic, subtitle: '准备、执行、检查，三步完成' },
      ...steps.map((step, index) => ({
        ...createNewCardTemplate('detail', index + 1, config),
        badge: `步骤 ${index + 1}`,
        title: step.title,
        detail: { points: step.points.map((point, pointIndex) => ({ tag: `${pointIndex + 1}`, title: point, content: '可按你的具体操作补充说明。' })) },
      })),
      createNewCardTemplate('outro', 4, config),
    ];
  } else {
    titles = [
      `🔥保姆级攻略！关于${cleanTopic}，看这篇就足够了`,
      `避坑不踩雷！${cleanTopic} 最全测评与新手指南`,
      `自用分享！${cleanTopic} 到底怎么选？课代表直接上答案`
    ];

    body = `花了大把时间精力做功课，终于把【${topic}】整理出一套最省心的干货卡片啦！🎉
拒绝复杂晦涩的术语，直接给大家划出最核心的避坑重点！

👉 看点速览：
1. 真实测评与核心特点全方位解析；
2. 左右横向对比，优缺点一目了然；
3. 到底适合谁、不适合谁，明确购买建议；
4. 常见误区与避雷指南！

高清大图已全部排版完毕，左滑查看每张图的详细分解👇 建议提前收藏，随用随翻！`;

    tags = ['#干货分享', '#保姆级教程', '#避坑指南', '#好物推荐', '#经验分享'];

    cards = [
      {
        id: 'card-1',
        type: 'cover',
        pageNum: 1,
        totalPages: 5,
        theme: config.theme,
        badge: '保姆级全攻略',
        title: topic,
        subtitle: '干货拉满！一文看懂核心要点与终极选购指南',
        heroImage: heroImg,
        footerAuthor: `@${author}`
      },
      {
        id: 'card-2',
        type: 'comparison',
        pageNum: 2,
        totalPages: 5,
        theme: config.theme,
        badge: '直观对比分析',
        title: '方案 A vs 方案 B 深度权衡',
        comparison: {
          colA: '推荐方案 A',
          colB: '替代方案 B',
          rows: [
            { metric: '使用门槛', valA: '开箱即用，上手极快', valB: '需要一定学习成本', highlight: 'A' },
            { metric: '性价比表现', valA: '用料扎实，价格亲民', valB: '溢价偏高，附加值多', highlight: 'A' },
            { metric: '售后与可靠性', valA: '品牌大厂，保障完善', valB: '质保期短，维修较贵', highlight: 'A' },
            { metric: '综合推荐度', valA: '⭐⭐⭐⭐⭐', valB: '⭐⭐⭐', highlight: 'A' }
          ]
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-3',
        type: 'detail',
        pageNum: 3,
        totalPages: 5,
        theme: config.theme,
        badge: '核心重点拆解',
        title: '必须注意的三个关键细节',
        detail: {
          alert: {
            type: 'warning',
            text: '重点提醒：切勿被花哨的营销词所迷惑，实用和耐用才是第一考量！'
          },
          points: [
            { tag: '要点一', title: '选对核心规格参数', content: '根据实际使用场景决定配置，不花冤枉钱。' },
            { tag: '要点二', title: '留意隐形耗材与维护成本', content: '提前了解后期使用中的持续投入与耗材更换周期。' },
            { tag: '要点三', title: '选择合规可靠的入手渠道', content: '认准官方授权，避免买到翻新或无保修假货。' }
          ]
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-4',
        type: 'verdict',
        pageNum: 4,
        totalPages: 5,
        theme: config.theme,
        badge: '综合红黑榜',
        title: '谁适合买 / 谁千万别买',
        verdict: {
          overallScore: 8.9,
          pros: ['做工精湛，细节考究', '实用性极高，解决核心痛点', '口碑稳定，大众认可度高'],
          cons: ['偶尔缺货需预约', '赠品相对单薄'],
          recommendWho: '注重实用价值、追求稳健体验的新手与理性消费者',
          avoidWho: '盲目跟风、预算严重超支的冲动型买家'
        },
        footerAuthor: `@${author}`
      },
      {
        id: 'card-5',
        type: 'outro',
        pageNum: 5,
        totalPages: 5,
        theme: config.theme,
        badge: '课代表总结',
        title: '写在最后的话',
        outro: {
          checklist: [
            '货比三家，不冲动消费',
            '点击右上角⭐收藏本帖，避免关键时刻找不到',
            '如果有疑问，欢迎在评论区随时留言'
          ],
          ctaText: '创作不易，喜欢请点个赞和关注吧！❤️',
          interactionQuestion: '对于这个话题，你有什么心得或想要吐槽的吗？'
        },
        footerAuthor: `@${author}`
      }
    ];
  }

  return {
    copy: {
      titles,
      selectedTitleIndex: 0,
      body: [
        '【本地模板示例】请用实际资料核对或替换示例内容。',
        body,
        config.details.trim() && `本篇关注点：${config.details.trim()}`,
      ].filter(Boolean).join('\n\n'),
      tags
    },
    cards: cards.map((card, index) => ({
      ...card,
      id: newCardId(),
      pageNum: index + 1,
      totalPages: cards.length,
      heroReferenceId: card.type === 'cover' ? selectedImg?.id : undefined,
      badge: `模板示例 · ${card.badge}`,
    })),
  };
}
