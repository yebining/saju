import { z } from "zod";
import { Category, CATEGORY_KEYS } from "../categories";
import type { OhaengCount } from "./data";

const OhaengCountSchema = z.object({
  wood: z.number(),
  fire: z.number(),
  earth: z.number(),
  metal: z.number(),
  water: z.number(),
});

export const ReadingFactsSchema = z.object({
  category: z.enum(CATEGORY_KEYS as [Category, ...Category[]]),
  score: z.number().int().min(0).max(100),
  meOhaeng: OhaengCountSchema,
  themOhaeng: OhaengCountSchema.nullable().optional(),
  relationLine: z.string().optional(),
  relationOhaengNote: z.string().optional(),
  hourUnknown: z.boolean(),
  cacheKey: z.string().optional(), // 서버 저장/조회 키 (= readingCacheKey)
});

export type ReadingFacts = z.infer<typeof ReadingFactsSchema>;

export const RichFactsSchema = ReadingFactsSchema.extend({
  pillars: z.object({
    year: z.object({ stemHan: z.string(), stemKo: z.string(), branchHan: z.string(), branchKo: z.string() }),
    month: z.object({ stemHan: z.string(), stemKo: z.string(), branchHan: z.string(), branchKo: z.string() }),
    day: z.object({ stemHan: z.string(), stemKo: z.string(), branchHan: z.string(), branchKo: z.string() }),
    hour: z.object({ stemHan: z.string(), stemKo: z.string(), branchHan: z.string(), branchKo: z.string() }).nullable(),
  }),
  daeun: z.array(z.object({
    startAge: z.number(), endAge: z.number(), startYear: z.number(), ganzhi: z.string(),
  })),
});

export type RichFacts = z.infer<typeof RichFactsSchema>;
