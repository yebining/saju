import { z } from "zod";

const Item = z.object({
  title: z.string().min(2).max(24),
  detail: z.string().min(10).max(220),
});

export const ReadingSchema = z.object({
  score: z.number().int().min(0).max(100),
  headline: z.string().min(4).max(40),
  ohaeng_note: z.string().min(10).max(200),
  strengths: z.array(Item).min(2).max(3),
  cautions: z.array(Item).min(1).max(2),
  advice: z.string().min(10).max(200),
  relation_line: z.string().min(2).max(60).optional(), // 관계 궁합에서만
});

export type Reading = z.infer<typeof ReadingSchema>;

const RichItem = z.object({
  title: z.string().min(2).max(24),
  detail: z.string().min(10).max(220),
});
const Section = z.string().min(30).max(260);

export const RichReadingSchema = z.object({
  score: z.number().int().min(0).max(100),
  headline: z.string().min(4).max(40),
  me: z.string().min(40).max(320),
  strengths: z.array(RichItem).min(2).max(3),
  cautions: z.array(RichItem).min(1).max(2),
  charm: Section,
  life_flow: z.object({
    early: z.string().min(20).max(220),
    mid: z.string().min(20).max(220),
    late: z.string().min(20).max(220),
    senior: z.string().min(20).max(220),
  }),
  love: Section,
  work_wealth: Section,
  health: Section,
  helpers: Section,
  now_advice: Section,
});

export type RichReading = z.infer<typeof RichReadingSchema>;
