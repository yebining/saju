import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserPrompt, buildRichSystemPrompt, buildRichUserPrompt } from "./reading-prompt";
import type { ReadingFacts, RichFacts } from "./reading-facts";

const facts: ReadingFacts = {
  category: "love",
  score: 68,
  meOhaeng: { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 },
  hourUnknown: false,
};

const richFacts: RichFacts = {
  category: "general", score: 72, hourUnknown: false,
  meOhaeng: { wood: 2, fire: 0, earth: 1, metal: 1, water: 4 },
  pillars: {
    year: { stemHan: "己", stemKo: "기", branchHan: "卯", branchKo: "묘" },
    month: { stemHan: "壬", stemKo: "임", branchHan: "申", branchKo: "신" },
    day: { stemHan: "癸", stemKo: "계", branchHan: "卯", branchKo: "묘" },
    hour: { stemHan: "壬", stemKo: "임", branchHan: "子", branchKo: "자" },
  },
  daeun: [
    { startAge: 8, endAge: 17, startYear: 2006, ganzhi: "癸酉" },
    { startAge: 18, endAge: 27, startYear: 2016, ganzhi: "甲戌" },
  ],
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

describe("buildRichSystemPrompt", () => {
  it("9섹션·용어금지·JSON 규칙을 담는다", () => {
    const s = buildRichSystemPrompt();
    expect(s).toContain("인생 흐름");
    expect(s).toMatch(/용어.*노출|노출.*않|용어.*쓰지/);
    expect(s).toContain("life_flow");
  });
});

describe("buildRichUserPrompt", () => {
  it("기둥·대운·점수를 담는다", () => {
    const u = buildRichUserPrompt(richFacts);
    expect(u).toContain("癸");
    expect(u).toContain("72");
    expect(u).toMatch(/대운|8~17|癸酉/);
  });
});
