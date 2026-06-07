import { describe, it, expect } from "vitest";
import { computeDaeun } from "./daeun";

const me = { year: 1999, month: 8, day: 19, hour: 1, minute: 2, isLunar: false, isLeapMonth: false, gender: "female" as const };

describe("computeDaeun", () => {
  it("대운 목록을 반환한다(나이 단조 증가, 간지 존재)", () => {
    const list = computeDaeun(me);
    expect(list.length).toBeGreaterThanOrEqual(6);
    for (let i = 1; i < list.length; i++) {
      expect(list[i].startAge).toBeGreaterThan(list[i - 1].startAge);
    }
    list.forEach((d) => expect(d.ganzhi.length).toBeGreaterThanOrEqual(2));
  });
});
