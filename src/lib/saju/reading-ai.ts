import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ReadingSchema, Reading, RichReadingSchema, RichReading } from "../schema";
import type { DeepReading } from "./reading-deep";
import { ReadingFacts, RichFacts } from "./reading-facts";
import { buildSystemPrompt, buildUserPrompt, buildRichSystemPrompt, buildRichUserPrompt } from "./reading-prompt";

const MODEL = "gemini-2.5-flash"; // 모델 교체는 이 한 줄

// 모듈 스코프 — 매 호출마다 재생성하지 않음. 키 없으면 요청 시점에 실패(라우트가 폴백).
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// AI가 생성하는 부분만. score·relation_line 은 외부에서 계산값으로 덮어쓰므로 제외.
const AIOutputSchema = ReadingSchema.omit({ score: true, relation_line: true }).extend({
  deep_sections: z
    .array(z.object({ title: z.string().min(2).max(24), body: z.string().min(20).max(400) }))
    .min(2)
    .max(3),
});

// 모델이 따를 출력 형태(structured output 스키마 대신 프롬프트로 강제 + zod로 검증).
const JSON_SHAPE = [
  "",
  "출력은 아래 형태의 JSON 객체 '하나만' 내보내세요. 코드펜스나 설명 없이 순수 JSON만:",
  "{",
  '  "headline": "4~40자 한 줄 총평",',
  '  "ohaeng_note": "10~200자, 기운에 대한 한 문단",',
  '  "strengths": [{ "title": "2~24자", "detail": "10~220자" }],  // 2~3개',
  '  "cautions": [{ "title": "2~24자", "detail": "10~220자" }],   // 1~2개',
  '  "advice": "10~200자 조언",',
  '  "deep_sections": [{ "title": "2~24자", "body": "20~400자" }] // 2~3개, 더 깊은 풀이',
  "}",
  "score 필드는 넣지 마세요(외부에서 계산). 명리 용어는 절대 쓰지 마세요.",
].join("\n");

/** 모델 응답에서 JSON 본문만 안전하게 추출(혹시 코드펜스/잡텍스트가 섞여도). */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) return text.slice(s, e + 1);
  return text.trim();
}

export async function generateReading(
  facts: ReadingFacts
): Promise<{ reading: Reading; deep: DeepReading }> {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: buildUserPrompt(facts),
    config: {
      systemInstruction: buildSystemPrompt() + "\n" + JSON_SHAPE,
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  const text = res.text;
  if (!text) throw new Error("Gemini 빈 응답");

  const out = AIOutputSchema.parse(JSON.parse(extractJson(text)));
  const { deep_sections, ...readingPart } = out;
  const reading: Reading = { ...readingPart, score: facts.score }; // 점수 고정

  if (facts.category === "relationship") {
    if (facts.relationLine) reading.relation_line = facts.relationLine;
    if (facts.relationOhaengNote) reading.ohaeng_note = facts.relationOhaengNote;
  }

  return { reading, deep: { sections: deep_sections } };
}

const AIRichOutputSchema = RichReadingSchema.omit({ score: true });

export async function generateRichReading(facts: RichFacts): Promise<RichReading> {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: buildRichUserPrompt(facts),
    config: {
      systemInstruction: buildRichSystemPrompt(),
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });
  const text = res.text;
  if (!text) throw new Error("Gemini 빈 응답");
  const out = AIRichOutputSchema.parse(JSON.parse(extractJson(text)));
  return { ...out, score: facts.score };
}
