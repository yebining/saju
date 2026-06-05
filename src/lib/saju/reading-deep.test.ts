import { describe, it, expect } from "vitest";
import { generateDeepBite } from "./reading-deep";

const count = { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 };

describe("generateDeepBite", () => {
  it("3개 섹션을 만든다", () => {
    const r = generateDeepBite("love", count);
    expect(r.sections).toHaveLength(3);
    r.sections.forEach((s) => {
      expect(s.title.length).toBeGreaterThan(2);
      expect(s.body.length).toBeGreaterThan(30);
    });
  });

  it("같은 입력에 항상 같은 결과(결정론)", () => {
    expect(generateDeepBite("wealth", count)).toEqual(generateDeepBite("wealth", count));
  });

  it("표면 텍스트에 영어 오행 키/명리 용어가 없다", () => {
    const text = generateDeepBite("general", count).sections.map((s) => s.title + s.body).join(" ");
    expect(text).not.toMatch(/wood|fire|earth|metal|water|상생|상극|일간/);
  });
});
