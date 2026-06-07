import { describe, it, expect } from "vitest";
import { calculateSaju, countOhaeng } from "./calculate";

describe("calculateSaju", () => {
  it("1990-05-01 14:30 양력 → 4기둥 계산", () => {
    const result = calculateSaju({
      year: 1990, month: 5, day: 1, hour: 14, minute: 30,
      isLunar: false, isLeapMonth: false,
    });
    expect(result.year.stem.ko).toBe("경");
    expect(result.year.branch.ko).toBe("오");
    expect(result.day.stem.ko).toBe("병");
    expect(result.day.branch.ko).toBe("인");
    expect(result.hour).not.toBeNull();
  });

  it("시 미상이면 hour는 null", () => {
    const result = calculateSaju({
      year: 1990, month: 5, day: 1, hour: null, minute: null,
      isLunar: false, isLeapMonth: false,
    });
    expect(result.hour).toBeNull();
  });

  it("countOhaeng — 4기둥 8글자 합산", () => {
    const pillars = calculateSaju({
      year: 1990, month: 5, day: 1, hour: 14, minute: 30,
      isLunar: false, isLeapMonth: false,
    });
    const count = countOhaeng(pillars);
    const total = count.wood + count.fire + count.earth + count.metal + count.water;
    expect(total).toBe(8);
  });

  it("2023 윤2월 15일 음력 → 양력 2023-04-05, 연주는 癸卯", () => {
    // 2023년에는 윤2월이 존재(양력 2023-03-22 ~ 2023-04-19).
    // 음력 윤2월 15일 = 양력 2023-04-05 → 계묘년.
    const result = calculateSaju({
      year: 2023, month: 2, day: 15, hour: 12, minute: 0,
      isLunar: true, isLeapMonth: true,
    });
    expect(result.year.stem.han).toBe("癸");
    expect(result.year.branch.han).toBe("卯");
  });
});

describe("진태양시 보정", () => {
  const me = { year: 1999, month: 8, day: 19, hour: 1, minute: 2, isLunar: false, isLeapMonth: false };

  it("시주가 경도 보정으로 壬子가 된다(癸丑 아님)", () => {
    const p = calculateSaju(me);
    expect(p.hour!.stem.han).toBe("壬");
    expect(p.hour!.branch.han).toBe("子");
  });

  it("오행이 표준과 일치한다 (목2 화0 토1 금1 수4)", () => {
    expect(countOhaeng(calculateSaju(me))).toEqual({ wood: 2, fire: 0, earth: 1, metal: 1, water: 4 });
  });

  it("시 미상이면 시주 null, 일주는 안정적", () => {
    const noHour = { ...me, hour: null, minute: null };
    const p = calculateSaju(noHour);
    expect(p.hour).toBeNull();
    expect(p.day.stem.han).toBe("癸");
  });
});
