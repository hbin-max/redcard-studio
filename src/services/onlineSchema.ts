import { z } from 'zod';

const text = z.string().trim().min(1);
const score = z.number().min(0).max(10);
const common = z.object({ badge: text, title: text, subtitle: text.optional() });

const onlineCard = z.discriminatedUnion('type', [
  common.extend({ type: z.literal('cover') }),
  common.extend({
    type: z.literal('comparison'),
    comparison: z.object({
      colA: text,
      colB: text,
      rows: z.array(z.object({ metric: text, valA: text, valB: text, highlight: z.enum(['A', 'B', 'none']).optional() })).min(1).max(6),
    }),
  }),
  common.extend({
    type: z.literal('detail'),
    detail: z.object({
      alert: z.object({ type: z.enum(['tip', 'warning', 'star']), text }).optional(),
      points: z.array(z.object({ tag: text, title: text, content: text })).min(1).max(4),
    }),
  }),
  common.extend({
    type: z.literal('verdict'),
    verdict: z.object({ overallScore: score, pros: z.array(text).max(4), cons: z.array(text).max(4), recommendWho: text, avoidWho: text }),
  }),
  common.extend({
    type: z.literal('outro'),
    outro: z.object({ checklist: z.array(text).min(1).max(4), ctaText: text, interactionQuestion: text }),
  }),
  common.extend({
    type: z.literal('radar'),
    radar: z.object({ axes: z.array(z.object({ label: text, value: z.number().min(0).max(100), note: text.optional() })).length(5), summary: text, score }),
  }),
  common.extend({
    type: z.literal('ingredient'),
    ingredient: z.object({
      targetSkin: text,
      items: z.array(z.object({ name: text, role: text, safety: z.enum(['safe', 'caution', 'warning']), score: z.number().min(1).max(5) })).min(1).max(4),
      verdict: text,
    }),
  }),
  common.extend({
    type: z.literal('quote'),
    quote: z.object({ goldenQuote: text, author: text, bookTitle: text, threeLevels: z.tuple([text, text, text]) }),
  }),
]);

export const onlineDeck = z.object({
  cards: z.array(onlineCard).min(1).max(8),
  copy: z.object({ titles: z.tuple([text, text, text]), body: text, tags: z.array(text).min(1).max(12) }),
});

export const completionResponse = z.object({
  choices: z.array(z.object({ message: z.object({ content: text }) })).min(1),
});
