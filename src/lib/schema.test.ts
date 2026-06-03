import { describe, it, expect } from "vitest";
import { ReadingSchema } from "./schema";

const valid = {
  score: 74,
  headline: "먼저 다가갈수록 풀리는 시기예요",
  ohaeng_note: "목·화 기운이 강해 표현이 풍부합니다.",
  strengths: [
    { title: "표현이 풍부", detail: "마음을 잘 드러내고 솔직하게 다가갑니다." },
    { title: "회복이 빠름", detail: "다툼 뒤에도 먼저 손 내미는 편입니다." },
  ],
  cautions: [{ title: "결정 미루기", detail: "금 기운이 약해 타이밍을 놓치기 쉽습니다." }],
  advice: "망설여질 땐 3일 안에 연락하세요.",
};

describe("ReadingSchema", () => {
  it("유효한 결과를 통과시킨다", () => {
    expect(ReadingSchema.safeParse(valid).success).toBe(true);
  });

  it("score 범위를 벗어나면 실패한다", () => {
    expect(ReadingSchema.safeParse({ ...valid, score: 130 }).success).toBe(false);
  });

  it("strengths가 비면 실패한다", () => {
    expect(ReadingSchema.safeParse({ ...valid, strengths: [] }).success).toBe(false);
  });

  it("relation_line은 선택값이다 (없어도 통과)", () => {
    expect(ReadingSchema.safeParse(valid).success).toBe(true);
    expect(ReadingSchema.safeParse({ ...valid, relation_line: "나 丙 × 상대 壬" }).success).toBe(true);
  });
});
