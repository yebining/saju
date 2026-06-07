import { describe, it, expect } from "vitest";
import { ReadingFactsSchema } from "./reading-facts";

const base = {
  category: "general",
  score: 72,
  meOhaeng: { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 },
  hourUnknown: false,
};

describe("ReadingFactsSchema", () => {
  it("유효한 1인 사실을 통과시킨다", () => {
    expect(ReadingFactsSchema.parse(base)).toMatchObject({ category: "general", score: 72 });
  });

  it("관계 궁합 사실(상대 오행 포함)을 통과시킨다", () => {
    const rel = {
      ...base,
      category: "relationship",
      themOhaeng: { wood: 1, fire: 1, earth: 2, metal: 2, water: 1 },
      relationLine: "나 甲(갑) × 상대 丙(병)",
      relationOhaengNote: "목생화 — 따뜻하게 키워주는 관계",
    };
    expect(ReadingFactsSchema.parse(rel).themOhaeng).toBeTruthy();
  });

  it("score 범위를 벗어나면 거부한다", () => {
    expect(() => ReadingFactsSchema.parse({ ...base, score: 130 })).toThrow();
  });

  it("알 수 없는 카테고리를 거부한다", () => {
    expect(() => ReadingFactsSchema.parse({ ...base, category: "nope" })).toThrow();
  });
});
