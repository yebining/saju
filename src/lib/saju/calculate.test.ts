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
});
