import { describe, it, expect } from "vitest";
import { CATEGORIES, getCategory, isCategory, CATEGORY_KEYS } from "./categories";

describe("categories", () => {
  it("5개 카테고리를 정의한다", () => {
    expect(CATEGORIES).toHaveLength(5);
    expect(CATEGORY_KEYS).toEqual(["general", "love", "wealth", "health", "relationship"]);
  });

  it("relationship만 2명 입력이다", () => {
    expect(getCategory("relationship").persons).toBe(2);
    expect(getCategory("love").persons).toBe(1);
    expect(getCategory("general").persons).toBe(1);
  });

  it("isCategory는 유효한 키만 통과시킨다", () => {
    expect(isCategory("love")).toBe(true);
    expect(isCategory("nope")).toBe(false);
  });

  it("getCategory는 알 수 없는 키에 throw 한다", () => {
    expect(() => getCategory("xyz" as never)).toThrow();
  });
});
