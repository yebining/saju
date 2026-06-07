import type { CheckInput } from "@/types";
import type { Reading } from "@/lib/schema";
import type { DeepReading } from "@/lib/saju/reading-deep";

/** 입력을 안정적으로 직렬화해 캐시 키 생성 (같은 생일·카테고리 = 같은 키) */
export function readingCacheKey(input: CheckInput): string {
  const norm = (p: CheckInput["me"]) =>
    [p.year, p.month, p.day, p.hour, p.minute, p.isLunar, p.isLeapMonth].join("|");
  const parts = [input.category, norm(input.me), input.them ? norm(input.them) : ""];
  return "reading:" + parts.join("::");
}

export type CachedReading = { reading: Reading; deep: DeepReading };

export function readCache(input: CheckInput): CachedReading | null {
  try {
    const raw = sessionStorage.getItem(readingCacheKey(input));
    return raw ? (JSON.parse(raw) as CachedReading) : null;
  } catch {
    return null;
  }
}

export function writeCache(input: CheckInput, value: CachedReading): void {
  try {
    sessionStorage.setItem(readingCacheKey(input), JSON.stringify(value));
  } catch {
    /* 용량 초과 등은 무시 (캐시는 부가기능) */
  }
}
