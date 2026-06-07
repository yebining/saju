import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserPrompt } from "./reading-prompt";
import type { ReadingFacts } from "./reading-facts";

const facts: ReadingFacts = {
  category: "love",
  score: 68,
  meOhaeng: { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 },
  hourUnknown: false,
};

describe("buildSystemPrompt", () => {
  it("톤·금지어 규칙을 담는다", () => {
    const s = buildSystemPrompt();
    expect(s).toContain("명리");
    expect(s).toMatch(/용어.*노출|노출.*않/);
    expect(s).toContain("점수");
  });
});

describe("buildUserPrompt", () => {
  it("카테고리·점수·오행 분포를 담는다", () => {
    const u = buildUserPrompt(facts);
    expect(u).toContain("연애");
    expect(u).toContain("68");
    expect(u).toMatch(/목|화|토|금|수/);
  });

  it("관계 궁합이면 상대 정보를 담는다", () => {
    const u = buildUserPrompt({
      ...facts,
      category: "relationship",
      themOhaeng: { wood: 1, fire: 1, earth: 2, metal: 2, water: 1 },
      relationLine: "나 甲(갑) × 상대 丙(병)",
      relationOhaengNote: "목생화 — 따뜻하게 키워주는 관계",
    });
    expect(u).toContain("상대");
  });
});
