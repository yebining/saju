import { describe, it, expect } from "vitest";
import { readingCacheKey } from "./reading-cache";
import type { CheckInput } from "@/types";

const input: CheckInput = {
  category: "general",
  me: { year: 1995, month: 5, day: 9, hour: 12, minute: 0, isLunar: false, isLeapMonth: false, gender: "female" },
};

describe("readingCacheKey", () => {
  it("같은 입력에 같은 키", () => {
    expect(readingCacheKey(input)).toBe(readingCacheKey({ ...input }));
  });
  it("카테고리가 다르면 키가 다르다", () => {
    expect(readingCacheKey(input)).not.toBe(readingCacheKey({ ...input, category: "love" }));
  });
  it("생일이 다르면 키가 다르다", () => {
    expect(readingCacheKey(input)).not.toBe(
      readingCacheKey({ ...input, me: { ...input.me, day: 10 } })
    );
  });
  it("키는 reading: 으로 시작한다", () => {
    expect(readingCacheKey(input).startsWith("reading:")).toBe(true);
  });
});
