import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ReadingSchema, Reading } from "../schema";
import type { DeepReading } from "./reading-deep";
import { ReadingFacts } from "./reading-facts";
import { buildSystemPrompt, buildUserPrompt } from "./reading-prompt";

const MODEL = "claude-sonnet-4-6"; // 모델 교체는 이 한 줄

// 모듈 스코프로 호이스팅 — 매 호출마다 재생성하지 않음.
// 키가 없어도 생성 자체는 throw하지 않고, 실제 요청(parse) 시점에 throw.
const client = new Anthropic();

const AIReadingSchema = ReadingSchema.extend({
  deep_sections: z
    .array(z.object({ title: z.string().min(2).max(24), body: z.string().min(20).max(400) }))
    .min(2)
    .max(3),
});

export async function generateReading(
  facts: ReadingFacts
): Promise<{ reading: Reading; deep: DeepReading }> {
  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(facts) }],
    output_config: { format: zodOutputFormat(AIReadingSchema) },
  });

  const out = res.parsed_output;
  if (!out) throw new Error("AI 풀이 파싱 실패");

  const { deep_sections, ...readingPart } = out;
  const reading: Reading = { ...readingPart, score: facts.score };

  if (facts.category === "relationship") {
    if (facts.relationLine) reading.relation_line = facts.relationLine;
    if (facts.relationOhaengNote) reading.ohaeng_note = facts.relationOhaengNote;
  }

  return { reading, deep: { sections: deep_sections } };
}
