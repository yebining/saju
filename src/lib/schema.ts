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
