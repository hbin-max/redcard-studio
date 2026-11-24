import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNewCardTemplate, generateXiaohongshuContent, regenerateSingleCard } from '../src/services/aiGenerator.ts';
import type { CardType, CategoryPreset, GenerationConfig, ReferenceImage } from '../src/types.ts';

const config: GenerationConfig = {
  topic: '一款虚构的手机', details: '示例素材', category: 'tech', theme: 'rose', cardCount: 5, authorName: '测试作者',
};
const online = { ...config, apiKey: 'mock-credential', apiBaseUrl: 'https://api.deepseek.com/', modelName: 'deepseek-flash' };
const image: ReferenceImage = { id: 'image-1', name: 'demo.png', dataUrl: 'data:image/png;base64,original', isMatted: true, mattedDataUrl: 'data:image/png;base64,matted', role: 'product' };
const types: CardType[] = ['cover', 'comparison', 'radar', 'verdict', 'outro'];

function onlineReply(cardTypes: CardType[]) {
  return {
    copy: { titles: ['标题一', '标题二', '标题三'], body: '正文', tags: ['#测试'] },
    cards: cardTypes.map((type, index) => createNewCardTemplate(type, index, config)),
  };
}

function completion(value: unknown) {
  return Response.json({ choices: [{ message: { content: JSON.stringify(value) } }] });
}

test('离线支持所有分类，页码连续且选用透明底封面', async () => {
  const categories: CategoryPreset[] = ['tech', 'knowledge', 'skincare', 'review', 'tutorial'];
  for (const category of categories) {
    const { cards, copy } = await generateXiaohongshuContent({ ...config, category }, [image]);
    assert.equal(cards.length, 5, category);
    assert.equal(copy.titles.length, 3, category);
    assert.equal(cards[0].heroImage, image.mattedDataUrl);
    assert.deepEqual(cards.map(card => card.pageNum), [1, 2, 3, 4, 5]);
    assert.equal(new Set(cards.map(card => card.id)).size, cards.length);
    if (category === 'knowledge') assert.ok(cards.some(card => card.type === 'quote'));
    if (category === 'skincare') assert.ok(cards.some(card => card.type === 'ingredient'));
  }
});

test('线上请求使用完整路径、超时限制和正确图片，保留雷达数据', async (t) => {
  const offline = await generateXiaohongshuContent(config, []);
  const mock = t.mock.method(globalThis, 'fetch', async (url: URL, options: RequestInit) => {
    assert.equal(url.href, 'https://api.deepseek.com/chat/completions');
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(new Headers(options.headers).get('Authorization'), 'Bearer mock-credential');
    const body = JSON.parse(String(options.body));
    assert.equal(body.model, 'deepseek-flash');
    assert.equal(body.thinking.type, 'disabled');
    assert.equal(body.messages[1].content[1].image_url.url, image.dataUrl);
    return completion(onlineReply(offline.cards.map(card => card.type)));
  });
  const result = await generateXiaohongshuContent(online, [image]);
  assert.equal(mock.mock.callCount(), 1);
  assert.equal(result.notice, undefined);
  assert.equal(result.cards.find(card => card.type === 'radar')?.radar?.axes.length, 5);
  assert.equal(result.cards[0].heroImage, image.mattedDataUrl);
});

for (const [name, reply] of [
  ['空内容', () => Response.json({ choices: [{ message: { content: '  ' } }] })],
  ['错误 JSON', () => Response.json({ choices: [{ message: { content: 'not valid JSON' } }] })],
  ['缺页或错序', () => completion(onlineReply(['outro']))],
  ['错误的嵌套字段', () => completion({ ...onlineReply(types), cards: [{ type: 'radar', title: '雷达', badge: '评分', radar: { axes: null } }] })],
  ['限流', () => new Response(null, { status: 429 })],
  ['超时', () => { throw new DOMException('timeout', 'TimeoutError'); }],
  ['网络中断', () => { throw new TypeError('network unavailable'); }],
] as const) {
  test(`${name}时回退到完整本地模板，并给出提示`, async (t) => {
    t.mock.method(globalThis, 'fetch', reply);
    const result = await generateXiaohongshuContent(online, []);
    assert.equal(result.cards.length, 5);
    assert.match(result.notice ?? '', /已使用本地模板/);
  });
}

test('脱离分类新增的卡片重新生成后仍保留类型、ID 和页码', async () => {
  const added = createNewCardTemplate('quote', 5, config);
  const result = await regenerateSingleCard(added, config, []);
  assert.equal(result.card.type, 'quote');
  assert.equal(result.card.id, added.id);
  assert.equal(result.card.pageNum, 6);
  assert.ok(result.card.quote);
  assert.ok(createNewCardTemplate('outro', 0, config).outro);
});

test('线上单页重写只接收目标类型，并保留整组页码', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: URL, options: RequestInit) => {
    assert.equal(url.href, 'https://api.deepseek.com/chat/completions');
    assert.equal(typeof JSON.parse(String(options.body)).messages[1].content, 'string');
    return completion(onlineReply(['quote']));
  });
  const added = createNewCardTemplate('quote', 5, config);
  const result = await regenerateSingleCard(added, { ...online, apiBaseUrl: 'https://api.deepseek.com/chat/completions' }, []);
  assert.equal(result.notice, undefined);
  assert.equal(result.card.id, added.id);
  assert.equal(result.card.totalPages, 6);
});
