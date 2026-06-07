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
});

export type ReadingFacts = z.infer<typeof ReadingFactsSchema>;
