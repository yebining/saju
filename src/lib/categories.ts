export type Category = "general" | "love" | "wealth" | "health" | "relationship";

export type CategoryMeta = {
  key: Category;
  name: string;
  desc: string;
  persons: 1 | 2;
  question: string; // 입력 화면 제목에 쓰는 한 줄
};

export const CATEGORIES: CategoryMeta[] = [
  { key: "general", name: "종합 사주", desc: "타고난 기운의 균형", persons: 1, question: "타고난 기운을 풀어드려요" },
  { key: "love", name: "연애운", desc: "지금의 연애 흐름", persons: 1, question: "지금의 연애 흐름을 봐드려요" },
  { key: "wealth", name: "재물운", desc: "돈과 기회의 결", persons: 1, question: "돈과 기회의 결을 봐드려요" },
  { key: "health", name: "건강운", desc: "몸과 컨디션의 기운", persons: 1, question: "몸과 컨디션의 기운을 봐드려요" },
  { key: "relationship", name: "관계 궁합", desc: "두 사람의 합·충·생·극", persons: 2, question: "두 사람의 궁합을 봐드려요" },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as Category[];

export function isCategory(value: string): value is Category {
  return CATEGORY_KEYS.includes(value as Category);
}

export function getCategory(key: Category): CategoryMeta {
  const found = CATEGORIES.find((c) => c.key === key);
  if (!found) throw new Error(`Unknown category: ${key}`);
  return found;
}

/** 점수 → 라벨 (모든 카테고리 공통) */
export function scoreLabel(score: number): "주의" | "보통" | "좋은 흐름" | "최고" {
  if (score < 50) return "주의";
  if (score < 70) return "보통";
  if (score < 88) return "좋은 흐름";
  return "최고";
}
