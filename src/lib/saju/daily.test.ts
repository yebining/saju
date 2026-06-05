import { describe, it, expect } from "vitest";
import { relate, dailyFortune } from "./daily";

describe("relate", () => {
  it("오행 관계를 5가지로 분류한다", () => {
    expect(relate("wood", "wood")).toBe("same");
    expect(relate("wood", "water")).toBe("supported"); // 수생목: 오늘이 나를 생함
    expect(relate("wood", "fire")).toBe("giving"); // 목생화: 내가 오늘을 생함
    expect(relate("wood", "metal")).toBe("pressured"); // 금극목: 오늘이 나를 극함
    expect(relate("wood", "earth")).toBe("empowered"); // 목극토: 내가 오늘을 극함
  });
});

describe("dailyFortune", () => {
  const base = { myDayOhaeng: "wood", todayDayOhaeng: "water", daySeed: 0 } as const;

  it("관계·색·음식·사람을 채운 결과를 만든다", () => {
    const r = dailyFortune(base);
    expect(r.mood).toContain("챙겨주는"); // supported 무드
    expect(r.color).toBe("남색"); // water 색
    expect(r.food).toBe("미역국"); // water 음식 풀[0]
    expect(r.person).toBe("오래된 친구"); // 사람 풀[0]
    expect(r.nudge.length).toBeGreaterThan(5);
  });

  it("같은 입력에 항상 같은 결과(결정론)", () => {
    expect(dailyFortune(base)).toEqual(dailyFortune(base));
  });

  it("표면 텍스트에 영어 오행 키/명리 용어가 없다", () => {
    const r = dailyFortune({ myDayOhaeng: "fire", todayDayOhaeng: "metal", daySeed: 3 });
    const text = [r.mood, r.nudge, r.food, r.color, r.person].join(" ");
    expect(text).not.toMatch(/wood|fire|earth|metal|water|상생|상극|일간/);
  });
});
