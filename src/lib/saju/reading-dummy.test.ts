import { describe, it, expect } from "vitest";
import { scoreFromOhaeng, generateDummyReading } from "./reading-dummy";
import { ReadingSchema } from "../schema";
import { calculateSaju, countOhaeng } from "./calculate";
import { scoreLabel } from "../categories";

describe("scoreFromOhaeng", () => {
  it("균형 잡힌 분포 {2,2,2,1,1}는 general에서 88점", () => {
    const count = { wood: 2, fire: 2, earth: 2, metal: 1, water: 1 };
    expect(scoreFromOhaeng(count, "general")).toBe(88);
  });

  it("점수는 40~95로 클램프된다", () => {
    const skewed = { wood: 8, fire: 0, earth: 0, metal: 0, water: 0 };
    const s = scoreFromOhaeng(skewed, "general");
    expect(s).toBeGreaterThanOrEqual(40);
    expect(s).toBeLessThanOrEqual(95);
  });
});

describe("generateDummyReading", () => {
  it("스키마를 만족하는 결과를 만든다", () => {
    const pillars = calculateSaju({
      year: 1990, month: 5, day: 1, hour: 14, minute: 30, isLunar: false, isLeapMonth: false,
    });
    const reading = generateDummyReading("love", countOhaeng(pillars));
    expect(ReadingSchema.safeParse(reading).success).toBe(true);
  });

  it("관계 궁합이면 relation_line을 포함한다", () => {
    const a = countOhaeng(calculateSaju({ year: 1990, month: 5, day: 1, hour: 14, minute: 30, isLunar: false, isLeapMonth: false }));
    const reading = generateDummyReading("relationship", a, { relationLine: "나 丙 × 상대 壬" });
    expect(reading.relation_line).toBe("나 丙 × 상대 壬");
  });

  it("사용자 문구에 영어 오행 키가 노출되지 않는다", () => {
    const count = { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 };
    const r = generateDummyReading("general", count);
    const text = [r.ohaeng_note, ...r.strengths.map(s => s.detail), ...r.cautions.map(c => c.detail), ...r.cautions.map(c => c.title)].join(" ");
    expect(text).not.toMatch(/wood|fire|earth|metal|water/);
  });
});

describe("scoreLabel", () => {
  it("점수 구간에 맞는 라벨을 반환한다", () => {
    expect(scoreLabel(49)).toBe("주의");
    expect(scoreLabel(88)).toBe("최고");
  });
});
