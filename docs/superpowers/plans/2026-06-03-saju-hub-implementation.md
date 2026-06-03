# 사주 허브 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 따뜻한 다(多)카테고리 사주 허브를 완성한다 — 5개 카테고리 입력 → 점수 게이지·오행 그래프·강점/주의점/조언 결과까지. 먼저 키 없이 더미 풀이로 전체 UX를 완성하고, 그다음 Supabase + 카테고리별 Claude API를 붙인다.

**Architecture:** Next.js 16 App Router. 사주 계산은 기존 `lib/saju/*`(순수 함수) 재사용. 카테고리 메타데이터를 단일 소스(`lib/categories.ts`)로 두고 홈·입력·결과·프롬프트가 공유. Phase 1(Task 1~12)은 클라이언트에서 계산 + sessionStorage + 더미 풀이로 키 없이 동작. Phase 2(Task 13~18)에서 API route가 Supabase 저장 + Claude 호출로 교체.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4(CSS-first), lunar-javascript, zod, vitest, (Phase 2) Supabase, @anthropic-ai/sdk (Claude Sonnet 4.6).

**참고 spec:** `docs/superpowers/specs/2026-06-03-saju-hub-redesign-design.md`

---

## 이미 완료된 것 (이 플랜 시작 전 상태)

- 디자인 토큰(`src/app/globals.css`) — 따뜻한 크림·테라코타 톤 ✅
- 홈 허브(`src/app/page.tsx`) — 카테고리 5종 카드 ✅
- 카테고리 입력 자리표시자(`src/app/check/[category]/page.tsx`) — Task 10에서 실제 입력으로 교체 ✅
- 사주 계산(`src/lib/saju/{data,calculate,relations}.ts` + `calculate.test.ts`) — 그대로 재사용 ✅
- GitHub push + Vercel 배포(홈만) ✅
- `src/types/lunar-javascript.d.ts` — 타입 선언 ✅

## 파일 구조 (이 플랜에서 생성/수정)

```
src/
├── lib/
│   ├── categories.ts              # [신규] 카테고리 단일 소스 (key/name/emoji/desc/persons/scoreLabel)
│   ├── categories.test.ts         # [신규]
│   ├── schema.ts                  # [신규] zod 풀이 결과 스키마 + 타입
│   ├── schema.test.ts             # [신규]
│   ├── prompts.ts                 # [신규, Phase 2] 카테고리별 시스템/유저 프롬프트
│   ├── claude.ts                  # [신규, Phase 2] Claude 호출 + tool use + zod
│   ├── supabase.ts                # [신규, Phase 2] Supabase 클라이언트
│   └── saju/
│       ├── reading-dummy.ts       # [신규] 더미 풀이 생성기 (결정론적, 폴백 겸용)
│       └── reading-dummy.test.ts  # [신규]
├── types/index.ts                 # [수정] Category, CheckInput 으로 정리
├── components/
│   ├── birth-input.tsx            # [신규] 1인 생일 입력 (나/상대 공용)
│   ├── score-gauge.tsx            # [신규] 원형 점수 게이지
│   ├── ohaeng-bar.tsx             # [수정] 따뜻한 톤 + 라벨
│   ├── manse-table.tsx            # [수정] 그대로 두고 결과에서 접이식으로 감쌈
│   └── reading-sections.tsx       # [신규] 강점/주의점/조언 카드
├── app/
│   ├── check/[category]/page.tsx  # [수정] 자리표시자 → 실제 입력 (1~2 step)
│   ├── result/[id]/page.tsx       # [신규] 결과 (Phase1: sessionStorage+더미 / Phase2: DB)
│   ├── not-found.tsx              # [신규]
│   └── api/generate-result/route.ts # [신규, Phase 2]
└── supabase/migrations/001_init.sql # [신규, Phase 2]
```

**제거(Task 12):** `src/app/check/page.tsx`(구 관계 폼), `src/app/manse/[id]/page.tsx`(구 만세 라우트), `src/components/input-form.tsx`(구 3-step 폼).

---

# Phase 1 — 키 없이 전체 UX 완성 (Task 1~12)

## Task 1: 카테고리 메타데이터 모듈

**Files:**
- Create: `src/lib/categories.ts`
- Test: `src/lib/categories.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/categories.test.ts`:
```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- categories`
Expected: FAIL — `Cannot find module './categories'`

- [ ] **Step 3: 구현**

`src/lib/categories.ts`:
```ts
export type Category = "general" | "love" | "wealth" | "health" | "relationship";

export type CategoryMeta = {
  key: Category;
  emoji: string;
  name: string;
  desc: string;
  persons: 1 | 2;
  question: string; // 입력 화면 제목에 쓰는 한 줄
};

export const CATEGORIES: CategoryMeta[] = [
  { key: "general", emoji: "🌿", name: "종합 사주", desc: "타고난 기운의 균형", persons: 1, question: "타고난 기운을 풀어드려요" },
  { key: "love", emoji: "💗", name: "연애운", desc: "지금의 연애 흐름", persons: 1, question: "지금의 연애 흐름을 봐드려요" },
  { key: "wealth", emoji: "💰", name: "재물운", desc: "돈과 기회의 결", persons: 1, question: "돈과 기회의 결을 봐드려요" },
  { key: "health", emoji: "🍀", name: "건강운", desc: "몸과 컨디션의 기운", persons: 1, question: "몸과 컨디션의 기운을 봐드려요" },
  { key: "relationship", emoji: "🫶", name: "관계 궁합", desc: "두 사람의 합·충·생·극", persons: 2, question: "두 사람의 궁합을 봐드려요" },
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- categories`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/categories.ts src/lib/categories.test.ts
git commit -m "feat: category metadata single source with tests"
```

---

## Task 2: 풀이 결과 zod 스키마

**Files:**
- Create: `src/lib/schema.ts`
- Test: `src/lib/schema.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { ReadingSchema } from "./schema";

const valid = {
  score: 74,
  headline: "먼저 다가갈수록 풀리는 시기예요",
  ohaeng_note: "목·화 기운이 강해 표현이 풍부합니다.",
  strengths: [
    { title: "표현이 풍부", detail: "마음을 잘 드러내고 솔직하게 다가갑니다." },
    { title: "회복이 빠름", detail: "다툼 뒤에도 먼저 손 내미는 편입니다." },
  ],
  cautions: [{ title: "결정 미루기", detail: "금 기운이 약해 타이밍을 놓치기 쉽습니다." }],
  advice: "망설여질 땐 3일 안에 연락하세요.",
};

describe("ReadingSchema", () => {
  it("유효한 결과를 통과시킨다", () => {
    expect(ReadingSchema.safeParse(valid).success).toBe(true);
  });

  it("score 범위를 벗어나면 실패한다", () => {
    expect(ReadingSchema.safeParse({ ...valid, score: 130 }).success).toBe(false);
  });

  it("strengths가 비면 실패한다", () => {
    expect(ReadingSchema.safeParse({ ...valid, strengths: [] }).success).toBe(false);
  });

  it("relation_line은 선택값이다 (없어도 통과)", () => {
    expect(ReadingSchema.safeParse(valid).success).toBe(true);
    expect(ReadingSchema.safeParse({ ...valid, relation_line: "나 丙 × 상대 壬" }).success).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- schema`
Expected: FAIL — `Cannot find module './schema'`

- [ ] **Step 3: 구현**

`src/lib/schema.ts`:
```ts
import { z } from "zod";

const Item = z.object({
  title: z.string().min(2).max(24),
  detail: z.string().min(10).max(220),
});

export const ReadingSchema = z.object({
  score: z.number().int().min(0).max(100),
  headline: z.string().min(4).max(40),
  ohaeng_note: z.string().min(10).max(200),
  strengths: z.array(Item).min(2).max(3),
  cautions: z.array(Item).min(1).max(2),
  advice: z.string().min(10).max(200),
  relation_line: z.string().min(2).max(60).optional(), // 관계 궁합에서만
});

export type Reading = z.infer<typeof ReadingSchema>;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- schema`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/schema.ts src/lib/schema.test.ts
git commit -m "feat: zod reading result schema with tests"
```

---

## Task 3: 더미 풀이 생성기 (결정론적)

오행 분포에서 점수와 문구를 결정론적으로 만든다. Phase 1의 결과 화면을 키 없이 채우고, Phase 2에서 LLM 실패 시 폴백으로도 쓴다.

**Files:**
- Create: `src/lib/saju/reading-dummy.ts`
- Test: `src/lib/saju/reading-dummy.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/saju/reading-dummy.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { scoreFromOhaeng, generateDummyReading } from "./reading-dummy";
import { ReadingSchema } from "../schema";
import { calculateSaju, countOhaeng } from "./calculate";

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
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- reading-dummy`
Expected: FAIL — `Cannot find module './reading-dummy'`

- [ ] **Step 3: 구현**

`src/lib/saju/reading-dummy.ts`:
```ts
import { OhaengCount } from "./data";
import { Category } from "../categories";
import { Reading } from "../schema";

const BIAS: Record<Category, number> = {
  general: 0, love: 2, wealth: -2, health: 1, relationship: 0,
};

/** 오행이 고를수록 높은 점수 (40~95 클램프). 결정론적. */
export function scoreFromOhaeng(count: OhaengCount, category: Category): number {
  const vals = [count.wood, count.fire, count.earth, count.metal, count.water];
  const total = vals.reduce((a, b) => a + b, 0) || 1;
  const ideal = total / 5;
  const variance = vals.reduce((s, v) => s + Math.abs(v - ideal), 0);
  const raw = Math.round(100 - (variance / total) * 40) + BIAS[category];
  return Math.max(40, Math.min(95, raw));
}

const STRONG_LABEL: Record<string, string> = {
  wood: "성장·추진력", fire: "표현·열정", earth: "안정·신뢰", metal: "결단·원칙", water: "유연·지혜",
};

function dominant(count: OhaengCount): keyof OhaengCount {
  return (Object.keys(count) as (keyof OhaengCount)[]).reduce((a, b) => (count[b] > count[a] ? b : a));
}
function weakest(count: OhaengCount): keyof OhaengCount {
  return (Object.keys(count) as (keyof OhaengCount)[]).reduce((a, b) => (count[b] < count[a] ? b : a));
}

const CAT_HEADLINE: Record<Category, string> = {
  general: "타고난 균형이 당신의 무기예요",
  love: "먼저 다가갈수록 풀리는 시기예요",
  wealth: "흐름을 읽으면 기회가 와요",
  health: "리듬을 지키면 든든한 한 해예요",
  relationship: "서로의 결이 맞물리는 사이예요",
};

/** 키 없이도 결과 화면을 채우는 결정론적 더미 풀이. Phase 2 LLM 폴백 겸용. */
export function generateDummyReading(
  category: Category,
  count: OhaengCount,
  opts?: { relationLine?: string }
): Reading {
  const score = scoreFromOhaeng(count, category);
  const dom = dominant(count);
  const weak = weakest(count);

  const reading: Reading = {
    score,
    headline: CAT_HEADLINE[category],
    ohaeng_note: `${STRONG_LABEL[dom]}의 ${dom} 기운이 두드러지고, ${weak} 기운은 보완이 필요해요.`,
    strengths: [
      { title: STRONG_LABEL[dom], detail: `${dom} 기운이 강해 이 분야에서 자기다움이 잘 드러납니다.` },
      { title: "회복 탄력성", detail: "기운의 흐름이 막혀도 스스로 균형을 되찾는 편입니다." },
    ],
    cautions: [
      { title: `${weak} 기운 부족`, detail: `${weak} 기운이 약해 결정·마무리에서 아쉬움이 생길 수 있어요.` },
    ],
    advice: "오늘 한 가지만 정해 작게 실천해보세요. 사주는 흐름이라 방향이 더 중요해요.",
  };
  if (category === "relationship" && opts?.relationLine) {
    reading.relation_line = opts.relationLine;
  }
  return reading;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- reading-dummy`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/saju/reading-dummy.ts src/lib/saju/reading-dummy.test.ts
git commit -m "feat: deterministic dummy reading generator with tests"
```

---

## Task 4: 공통 타입 정리

기존 `FullInput`/`RelationContext`(관계 전용)를 카테고리 기반 `CheckInput`으로 교체한다.

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: 전체 교체**

`src/types/index.ts` (전체 교체):
```ts
import { Category } from "@/lib/categories";

export type PersonInput = {
  year: number;
  month: number;
  day: number;
  hour: number | null;     // 시 미상이면 null
  minute: number | null;
  isLunar: boolean;
  isLeapMonth: boolean;
  gender: "male" | "female";
};

export type CheckInput = {
  category: Category;
  me: PersonInput;
  them?: PersonInput;       // relationship 카테고리에서만
  note?: string;            // 한 줄 자유 입력 (선택)
};
```

- [ ] **Step 2: 타입 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 구 `input-form.tsx` / 구 `check/page.tsx` / 구 `manse/[id]/page.tsx`가 아직 `FullInput`을 참조해 에러가 날 수 있음. 이는 Task 10~12에서 제거/교체되므로 **여기서는 신규 타입 자체가 에러 없이 컴파일되는지만** 확인. (구 파일 에러는 Task 12 완료 후 사라짐.)

> **NOTE:** 빌드 그린 상태를 유지하려면 Task 4 직후 Task 12(구 파일 제거)를 먼저 처리해도 된다. 본 플랜은 UI(Task 5~11)를 먼저 만든 뒤 Task 12에서 한 번에 정리한다. 중간 커밋들이 `tsc`에서 구 파일 에러를 낼 수 있으나 `next dev`는 라우트 단위 컴파일이라 신규 화면 확인에는 지장 없다.

- [ ] **Step 3: 커밋**

```bash
git add src/types/index.ts
git commit -m "refactor: category-based CheckInput type"
```

---

## Task 5: 생일 입력 컴포넌트 (나/상대 공용)

**Files:**
- Create: `src/components/birth-input.tsx`

- [ ] **Step 1: 구현**

`src/components/birth-input.tsx`:
```tsx
"use client";
import { useState } from "react";
import { PersonInput } from "@/types";

export function emptyPerson(): PersonInput {
  return { year: 1995, month: 1, day: 1, hour: 12, minute: 0, isLunar: false, isLeapMonth: false, gender: "female" };
}

type Props = {
  value: PersonInput;
  onChange: (v: PersonInput) => void;
  title: string;
};

const field = "w-full rounded-xl border border-border bg-card p-3 text-center text-base text-fg outline-none focus:border-accent";

export function BirthInput({ value, onChange, title }: Props) {
  const [hourUnknown, setHourUnknown] = useState(value.hour === null);

  return (
    <div className="space-y-4">
      <h2 className="text-xl text-fg">{title}</h2>

      <div className="flex gap-2 rounded-xl bg-border/40 p-1">
        {[false, true].map((lunar) => (
          <button
            key={String(lunar)}
            type="button"
            onClick={() => onChange({ ...value, isLunar: lunar })}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              value.isLunar === lunar ? "bg-card text-accent shadow-sm" : "text-muted"
            }`}
          >
            {lunar ? "음력" : "양력"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input type="number" inputMode="numeric" min={1900} max={2026} value={value.year}
          onChange={(e) => onChange({ ...value, year: +e.target.value })} placeholder="년" className={field} />
        <input type="number" inputMode="numeric" min={1} max={12} value={value.month}
          onChange={(e) => onChange({ ...value, month: +e.target.value })} placeholder="월" className={field} />
        <input type="number" inputMode="numeric" min={1} max={31} value={value.day}
          onChange={(e) => onChange({ ...value, day: +e.target.value })} placeholder="일" className={field} />
      </div>

      {value.isLunar && (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={value.isLeapMonth}
            onChange={(e) => onChange({ ...value, isLeapMonth: e.target.checked })} />
          윤달이에요
        </label>
      )}

      <label className="flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" checked={hourUnknown}
          onChange={(e) => {
            setHourUnknown(e.target.checked);
            onChange({ ...value, hour: e.target.checked ? null : 12, minute: e.target.checked ? null : 0 });
          }} />
        태어난 시간을 몰라요 <span className="text-muted">(괜찮아요!)</span>
      </label>

      {!hourUnknown && (
        <div className="grid grid-cols-2 gap-2">
          <input type="number" inputMode="numeric" min={0} max={23} value={value.hour ?? 0}
            onChange={(e) => onChange({ ...value, hour: +e.target.value })} placeholder="시" className={field} />
          <input type="number" inputMode="numeric" min={0} max={59} value={value.minute ?? 0}
            onChange={(e) => onChange({ ...value, minute: +e.target.value })} placeholder="분" className={field} />
        </div>
      )}

      <div className="flex gap-2 rounded-xl bg-border/40 p-1">
        {(["female", "male"] as const).map((g) => (
          <button key={g} type="button" onClick={() => onChange({ ...value, gender: g })}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              value.gender === g ? "bg-card text-accent shadow-sm" : "text-muted"
            }`}>
            {g === "female" ? "여성" : "남성"}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 컴파일 확인**

Run: `npx tsc --noEmit src/components/birth-input.tsx` 대신 전체 `next build`는 Task 12 후 수행. 여기서는 import만 점검 — 다음 task에서 페이지에 붙여 `next dev`로 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/components/birth-input.tsx
git commit -m "feat: reusable birth input component (warm style)"
```

---

## Task 6: 점수 게이지 컴포넌트

**Files:**
- Create: `src/components/score-gauge.tsx`

- [ ] **Step 1: 구현**

`src/components/score-gauge.tsx`:
```tsx
import { scoreLabel } from "@/lib/categories";

/** 0~100 점수를 원형 게이지로. r=52, 둘레≈326.7 */
export function ScoreGauge({ score }: { score: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = C * (1 - clamped / 100);
  return (
    <div className="relative mx-auto h-32 w-32">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#EBD9C7" strokeWidth="11" />
        <circle cx="64" cy="64" r={R} fill="none" stroke="#B5562F" strokeWidth="11"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl leading-none text-accent">{clamped}</span>
        <span className="mt-1 text-xs text-muted">{scoreLabel(clamped)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/score-gauge.tsx
git commit -m "feat: circular score gauge component"
```

---

## Task 7: 오행 막대 따뜻한 톤으로 리스타일 (라벨 포함)

**Files:**
- Modify: `src/components/ohaeng-bar.tsx`

- [ ] **Step 1: 전체 교체**

`src/components/ohaeng-bar.tsx` (전체 교체 — 막대 위에 글자 수 라벨 표시):
```tsx
import { OhaengCount } from "@/lib/saju/data";

const COLORS = { wood: "#7BA77E", fire: "#C75A4A", earth: "#B89F6E", metal: "#A8A8A8", water: "#5476A8" };
const LABELS = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
type Key = keyof typeof COLORS;

export function OhaengBar({ count, name }: { count: OhaengCount; name?: string }) {
  const total = (Object.keys(COLORS) as Key[]).reduce((s, k) => s + count[k], 0) || 1;
  const max = Math.max(...(Object.keys(COLORS) as Key[]).map((k) => count[k]), 1);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold text-muted">{name ? `${name}의 ` : ""}오행 밸런스</p>
      <div className="flex h-16 items-end gap-2">
        {(Object.keys(COLORS) as Key[]).map((k) => (
          <div key={k} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t-md transition-all"
              style={{ height: `${Math.max((count[k] / max) * 100, 4)}%`, backgroundColor: COLORS[k] }} />
            <span className="text-xs text-fg">{LABELS[k]} {count[k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

> `total`은 향후 비율 표기 확장을 위해 계산하되 현재는 `max` 기준 높이만 사용한다. (린트가 미사용 경고를 내면 `total` 라인을 제거.)

- [ ] **Step 2: 커밋**

```bash
git add src/components/ohaeng-bar.tsx
git commit -m "feat: warm vertical ohaeng bar with labels"
```

---

## Task 8: 만세력 표 (결과에서 접이식으로 사용)

기존 `manse-table.tsx`는 그대로 두고(다크 톤 클래스만 따뜻하게 점검), 결과 페이지에서 `<details>`로 감싼다. 여기서는 표의 색 클래스만 토큰 기반인지 확인.

**Files:**
- Modify: `src/components/manse-table.tsx` (필요 시)

- [ ] **Step 1: 현재 파일 확인 후 토큰 클래스 정합성 점검**

Run: 파일을 열어 `bg-card`, `border-border`, `text-accent`, `text-muted`, `text-fg`만 쓰는지 확인. 다크 전용 색(`bg-zinc-*` 등)이 있으면 토큰 클래스로 치환. 구조/마크업은 변경하지 않는다.

- [ ] **Step 2: (변경이 있었다면) 커밋**

```bash
git add src/components/manse-table.tsx
git commit -m "style: align manse table with warm tokens"
```

> 변경이 없으면 이 task는 건너뛴다.

---

## Task 9: 강점/주의점/조언 섹션 컴포넌트

**Files:**
- Create: `src/components/reading-sections.tsx`

- [ ] **Step 1: 구현**

`src/components/reading-sections.tsx`:
```tsx
import { Reading } from "@/lib/schema";

function CardList({ icon, title, items }: { icon: string; title: string; items: Reading["strengths"] }) {
  return (
    <section className="space-y-2">
      <h3 className="text-base text-fg">{icon} {title}</h3>
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-1 font-bold text-accent">{it.title}</p>
          <p className="text-sm leading-relaxed text-fg/90">{it.detail}</p>
        </div>
      ))}
    </section>
  );
}

export function ReadingSections({ reading }: { reading: Reading }) {
  return (
    <div className="space-y-6">
      <CardList icon="✨" title="강점" items={reading.strengths} />
      <CardList icon="⚠️" title="주의할 점" items={reading.cautions} />
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-1 text-base text-fg">💡 한 줄 조언</h3>
        <p className="text-sm leading-relaxed text-fg/90">{reading.advice}</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/reading-sections.tsx
git commit -m "feat: reading sections (strengths/cautions/advice)"
```

---

## Task 10: 입력 페이지 (카테고리 기반, 1~2 step)

자리표시자를 실제 입력 폼으로 교체. Phase 1에서는 계산을 클라이언트에서 하고 sessionStorage에 저장 후 `/result/[id]`로 이동.

**Files:**
- Modify(전체 교체): `src/app/check/[category]/page.tsx`

- [ ] **Step 1: 전체 교체**

`src/app/check/[category]/page.tsx`:
```tsx
"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isCategory, getCategory } from "@/lib/categories";
import { BirthInput, emptyPerson } from "@/components/birth-input";
import { PersonInput, CheckInput } from "@/types";

export default function CheckPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const router = useRouter();
  const [me, setMe] = useState<PersonInput>(emptyPerson());
  const [them, setThem] = useState<PersonInput>(emptyPerson());
  const [step, setStep] = useState<1 | 2>(1);

  if (!isCategory(category)) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted">알 수 없는 카테고리예요.</p>
        <Link href="/" className="mt-4 inline-block text-accent">← 처음으로</Link>
      </main>
    );
  }
  const meta = getCategory(category);
  const twoPerson = meta.persons === 2;

  const submit = () => {
    const input: CheckInput = { category, me, ...(twoPerson ? { them } : {}) };
    const id = crypto.randomUUID();
    sessionStorage.setItem(`saju:${id}`, JSON.stringify(input));
    router.push(`/result/${id}`);
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <p className="text-sm font-bold text-accent">{meta.emoji} {meta.name}</p>
      <h1 className="mt-1 mb-6 text-2xl text-fg">{meta.question}</h1>

      {twoPerson && (
        <div className="mb-6 flex gap-2">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded ${s <= step ? "bg-accent" : "bg-border"}`} />
          ))}
        </div>
      )}

      {(!twoPerson || step === 1) && (
        <BirthInput value={me} onChange={setMe} title={twoPerson ? "나의 생일" : "생일을 알려주세요 🎂"} />
      )}
      {twoPerson && step === 2 && (
        <BirthInput value={them} onChange={setThem} title="상대의 생일" />
      )}

      <div className="mt-8 flex items-center justify-between">
        {twoPerson && step === 2 ? (
          <button onClick={() => setStep(1)} className="text-sm text-muted">← 이전</button>
        ) : <span />}
        {twoPerson && step === 1 ? (
          <button onClick={() => setStep(2)} className="rounded-xl bg-accent px-6 py-3 font-bold text-white">다음 →</button>
        ) : (
          <button onClick={submit} className="rounded-xl bg-accent px-6 py-3 font-bold text-white">
            {meta.name} 보기 →
          </button>
        )}
      </div>

      <Link href="/" className="mt-8 block text-center text-sm text-muted hover:text-accent">← 처음으로</Link>
    </main>
  );
}
```

> **NOTE (Next 16):** 클라이언트 컴포넌트에서 `params`(Promise)는 React의 `use()`로 언랩한다. 서버 컴포넌트라면 `await params`.

- [ ] **Step 2: dev로 동작 확인**

Run: `npm run dev` → http://localhost:3000/check/love (1인) 와 /check/relationship (2인, step 2까지) 진행 → 제출 시 `/result/<uuid>`로 이동(아직 결과 페이지는 Task 11). 콘솔 에러 없이 이동하면 OK.

- [ ] **Step 3: 커밋**

```bash
git add "src/app/check/[category]/page.tsx"
git commit -m "feat: category-based input page (1 or 2 person)"
```

---

## Task 11: 결과 페이지 (Phase 1 — sessionStorage + 더미 풀이)

**Files:**
- Create: `src/app/result/[id]/page.tsx`
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: 결과 페이지 구현**

`src/app/result/[id]/page.tsx`:
```tsx
"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckInput } from "@/types";
import { getCategory } from "@/lib/categories";
import { calculateSaju, countOhaeng } from "@/lib/saju/calculate";
import { describeRelation } from "@/lib/saju/relations";
import { generateDummyReading } from "@/lib/saju/reading-dummy";
import { Reading } from "@/lib/schema";
import { ScoreGauge } from "@/components/score-gauge";
import { OhaengBar } from "@/components/ohaeng-bar";
import { ReadingSections } from "@/components/reading-sections";
import { ManseTable } from "@/components/manse-table";
import { SajuPillars } from "@/lib/saju/data";

type View = {
  category: CheckInput["category"];
  mePillars: SajuPillars;
  themPillars: SajuPillars | null;
  meOhaeng: ReturnType<typeof countOhaeng>;
  themOhaeng: ReturnType<typeof countOhaeng> | null;
  reading: Reading;
  hourUnknown: boolean;
};

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`saju:${id}`);
    if (!raw) { router.replace("/not-found"); return; }
    const input: CheckInput = JSON.parse(raw);
    const mePillars = calculateSaju(input.me);
    const meOhaeng = countOhaeng(mePillars);
    const themPillars = input.them ? calculateSaju(input.them) : null;
    const themOhaeng = themPillars ? countOhaeng(themPillars) : null;
    const relationLine = themPillars
      ? `나 ${mePillars.day.stem.han}(${mePillars.day.stem.ko}) × 상대 ${themPillars.day.stem.han}(${themPillars.day.stem.ko})`
      : undefined;
    const reading = generateDummyReading(input.category, meOhaeng, { relationLine });
    if (input.category === "relationship" && themPillars) {
      reading.ohaeng_note = describeRelation(mePillars.day, themPillars.day);
    }
    setView({
      category: input.category, mePillars, themPillars, meOhaeng, themOhaeng, reading,
      hourUnknown: !input.me.hour || (!!input.them && !input.them.hour),
    });
  }, [id, router]);

  if (!view) return <div className="p-12 text-center text-muted">풀이 불러오는 중…</div>;
  const meta = getCategory(view.category);

  return (
    <main className="mx-auto max-w-md space-y-8 px-6 py-12">
      {view.hourUnknown && (
        <p className="rounded-xl border border-border bg-card px-3 py-2 text-center text-xs text-muted">
          ⏱ 시 미상으로 풀이했어요 — 시간을 알면 더 정확해져요
        </p>
      )}

      <div className="text-center">
        <span className="inline-block rounded-full bg-card px-3 py-1 text-xs font-bold text-accent shadow-sm">
          {meta.emoji} {meta.name}
        </span>
        <div className="mt-4"><ScoreGauge score={view.reading.score} /></div>
        <p className="mt-4 px-4 font-serif text-lg text-fg">&ldquo;{view.reading.headline}&rdquo;</p>
        {view.reading.relation_line && <p className="mt-2 text-sm text-muted">{view.reading.relation_line}</p>}
      </div>

      <OhaengBar count={view.meOhaeng} name={view.themOhaeng ? "나" : undefined} />
      {view.themOhaeng && <OhaengBar count={view.themOhaeng} name="상대" />}

      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-fg/90 shadow-sm">
        {view.reading.ohaeng_note}
      </p>

      <ReadingSections reading={view.reading} />

      <details className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-bold text-muted">내 사주 자세히 보기</summary>
        <div className="mt-4 space-y-6">
          <ManseTable pillars={view.mePillars} name="나" />
          {view.themPillars && <ManseTable pillars={view.themPillars} name="상대" />}
        </div>
      </details>

      <p className="pt-4 text-center text-xs leading-relaxed text-muted">
        AI가 명리학 기본 규칙으로 풀이한 결과예요. 인생의 결정은 결국 본인의 몫이에요.
      </p>
      <Link href="/" className="block text-center text-sm text-muted hover:text-accent">처음으로</Link>
    </main>
  );
}
```

- [ ] **Step 2: not-found 페이지**

`src/app/not-found.tsx`:
```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl text-fg">결과를 찾을 수 없어요</h1>
      <p className="text-muted">결과가 만료되었거나 주소가 잘못됐어요.</p>
      <Link href="/" className="mt-2 rounded-xl bg-accent px-6 py-3 font-bold text-white">처음으로</Link>
    </main>
  );
}
```

- [ ] **Step 3: dev로 전체 흐름 확인**

Run: `npm run dev` → 홈 → 카테고리 → 입력 → 결과까지. 1인(연애운)과 2인(관계 궁합) 모두 점수 게이지·오행 그래프·강점/주의점·접이식 만세력이 보이면 OK. 새로고침 시 sessionStorage가 남아있어 결과 유지.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/result/[id]/page.tsx" src/app/not-found.tsx
git commit -m "feat: result page with gauge, ohaeng, reading, collapsible manse (dummy)"
```

---

## Task 12: 구 라우트/컴포넌트 제거 + 빌드 그린

**Files:**
- Delete: `src/app/check/page.tsx`
- Delete: `src/app/manse/[id]/page.tsx` (및 빈 `src/app/manse/` 폴더)
- Delete: `src/components/input-form.tsx`

- [ ] **Step 1: 삭제**

```bash
cd saju
rm src/app/check/page.tsx
rm -rf src/app/manse
rm src/components/input-form.tsx
```

- [ ] **Step 2: 잔여 참조 검색**

Run: `grep -rn "FullInput\|RelationContext\|input-form\|/manse/" src` (테스트 디렉터리 제외)
Expected: 결과 없음. 있으면 해당 파일 정리.

- [ ] **Step 3: 전체 테스트 + 빌드**

Run: `npm run test:run`
Expected: 모든 테스트 PASS (calculate, categories, schema, reading-dummy)

Run: `npm run build`
Expected: 빌드 성공. Route 목록에 `/`, `/check/[category]`, `/result/[id]`, `/_not-found`. 구 `/check`, `/manse/[id]` 없음.

- [ ] **Step 4: 커밋 + 배포(자동)**

```bash
git add -A
git commit -m "chore: remove legacy relationship-only routes and components"
git push
```

> push하면 Vercel이 자동 재배포. 배포 URL에서 Phase 1 전체 흐름 확인.

---

# Phase 2 — Supabase + 카테고리별 Claude API (Task 13~18)

> **선결 외부 작업:** Supabase 프로젝트(키 3개), Anthropic API key. `saju/.env.local`에 추가:
> ```
> NEXT_PUBLIC_SUPABASE_URL=...
> NEXT_PUBLIC_SUPABASE_ANON_KEY=...
> SUPABASE_SERVICE_KEY=...
> ANTHROPIC_API_KEY=sk-ant-...
> ```
> Vercel 프로젝트 Settings → Environment Variables 에도 동일하게 추가.

## Task 13: Supabase 클라이언트 + 마이그레이션

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `supabase/migrations/001_init.sql`

- [ ] **Step 1: 마이그레이션 SQL**

`supabase/migrations/001_init.sql`:
```sql
create table public.results (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  input jsonb not null,
  me_pillars jsonb not null,
  them_pillars jsonb,
  reading jsonb,
  status text not null default 'pending',  -- 'pending' | 'ready' | 'failed'
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

create index idx_results_expires_at on public.results (expires_at);

alter table public.results enable row level security;

create policy "anyone with id can read"
  on public.results for select using (true);
-- insert/update는 서버(service_role)만. anon 정책 없음 → RLS가 막음.
```

Supabase 콘솔 SQL Editor에서 실행.

- [ ] **Step 2: 클라이언트**

`src/lib/supabase.ts`:
```ts
import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/supabase.ts supabase/
git commit -m "feat: supabase client and results schema (with category)"
```

---

## Task 14: 카테고리별 프롬프트

**Files:**
- Create: `src/lib/prompts.ts`

- [ ] **Step 1: 구현**

`src/lib/prompts.ts`:
```ts
import { Category } from "./categories";
import { SajuPillars } from "./saju/data";

const BASE = `당신은 한국 명리학에 정통한 따뜻하고 진지한 사주 상담사입니다. 천간지지·오행 상생상극·일간 관계를 근거로 풀이하되, 점치듯 단정하지 않고 다정한 친구처럼 전달합니다.

원칙:
- 오행 분포와 일간을 근거로 구체적으로 풀이
- 강점 2~3개, 주의점 1~2개, 한 줄 조언 1개
- 점수(0~100)는 사주 조합을 종합해 정수로
- 인생의 결정은 본인의 몫임을 톤으로 전달
- 반드시 제공된 도구를 호출해 구조화된 JSON으로만 답하세요.`;

const PERSPECTIVE: Record<Category, string> = {
  general: "전반적인 기운의 균형과 타고난 성향을 종합적으로 풀이하세요.",
  love: "연애·관계운 관점에서 지금 시기의 흐름과 태도를 풀이하세요.",
  wealth: "재물·기회운 관점에서 돈을 다루는 성향과 흐름을 풀이하세요.",
  health: "건강·체력 관점에서 컨디션과 생활 리듬을 풀이하세요.",
  relationship: "두 사람의 일간/오행 합·충·생·극을 근거로 궁합을 풀이하고, relation_line에 '나 X × 상대 Y' 형식 한 줄을 넣으세요.",
};

export function systemPrompt(category: Category): string {
  return `${BASE}\n\n[이번 풀이 관점]\n${PERSPECTIVE[category]}`;
}

export function userMessage(args: {
  category: Category;
  mePillars: SajuPillars;
  themPillars?: SajuPillars | null;
  note?: string;
}): string {
  return `# 사주 정보
## 나
${JSON.stringify(args.mePillars, null, 2)}
${args.themPillars ? `\n## 상대\n${JSON.stringify(args.themPillars, null, 2)}` : ""}

## 메모
${args.note || "(없음)"}

위 사주를 풀이해 결과 도구를 호출해주세요.`;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/prompts.ts
git commit -m "feat: per-category claude prompts"
```

---

## Task 15: Claude 클라이언트 (tool use + zod + 폴백)

**Files:**
- Create: `src/lib/claude.ts`

- [ ] **Step 1: 구현**

`src/lib/claude.ts`:
```ts
import Anthropic from "@anthropic-ai/sdk";
import { ReadingSchema, Reading } from "./schema";
import { Category } from "./categories";
import { systemPrompt, userMessage } from "./prompts";
import { SajuPillars } from "./saju/data";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const TOOL: Anthropic.Tool = {
  name: "submit_reading",
  description: "사주 풀이 결과를 구조화하여 제출",
  input_schema: {
    type: "object",
    required: ["score", "headline", "ohaeng_note", "strengths", "cautions", "advice"],
    properties: {
      score: { type: "number" },
      headline: { type: "string" },
      ohaeng_note: { type: "string" },
      strengths: {
        type: "array", minItems: 2, maxItems: 3,
        items: { type: "object", required: ["title", "detail"], properties: { title: { type: "string" }, detail: { type: "string" } } },
      },
      cautions: {
        type: "array", minItems: 1, maxItems: 2,
        items: { type: "object", required: ["title", "detail"], properties: { title: { type: "string" }, detail: { type: "string" } } },
      },
      advice: { type: "string" },
      relation_line: { type: "string" },
    },
  },
};

export async function generateReading(args: {
  category: Category;
  mePillars: SajuPillars;
  themPillars?: SajuPillars | null;
  note?: string;
}): Promise<Reading> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt(args.category),
      messages: [{ role: "user", content: userMessage(args) }],
      tools: [TOOL],
      tool_choice: { type: "tool", name: "submit_reading" },
    });
    const toolUse = res.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
    if (toolUse) {
      const parsed = ReadingSchema.safeParse(toolUse.input);
      if (parsed.success) return parsed.data;
    }
    if (attempt === 1) throw new Error("LLM did not return a valid reading");
  }
  throw new Error("Unreachable");
}
```

> 캐싱: 시스템 프롬프트가 길어지면 `system`을 `[{type:"text", text, cache_control:{type:"ephemeral"}}]` 배열 형태로 바꿔 prompt caching 적용 (claude-api 스킬 참고). MVP에서는 생략 가능.

- [ ] **Step 2: 커밋**

```bash
git add src/lib/claude.ts
git commit -m "feat: claude client with tool use, zod validation, retry"
```

---

## Task 16: API route

**Files:**
- Create: `src/app/api/generate-result/route.ts`

- [ ] **Step 1: 구현**

`src/app/api/generate-result/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { calculateSaju, countOhaeng } from "@/lib/saju/calculate";
import { describeRelation } from "@/lib/saju/relations";
import { generateReading } from "@/lib/claude";
import { generateDummyReading } from "@/lib/saju/reading-dummy";
import { supabaseAdmin } from "@/lib/supabase";
import { isCategory } from "@/lib/categories";
import { CheckInput } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const input: CheckInput = await req.json();
    if (!isCategory(input.category) || !input.me) {
      return NextResponse.json({ error: "잘못된 입력이에요." }, { status: 400 });
    }
    const mePillars = calculateSaju(input.me);
    const themPillars = input.them ? calculateSaju(input.them) : null;

    const supabase = supabaseAdmin();
    const { data: row, error } = await supabase
      .from("results")
      .insert({ category: input.category, input, me_pillars: mePillars, them_pillars: themPillars, status: "pending" })
      .select("id").single();
    if (error || !row) throw error ?? new Error("insert failed");

    let reading;
    try {
      reading = await generateReading({ category: input.category, mePillars, themPillars, note: input.note });
    } catch (e) {
      console.error("LLM failed, using dummy fallback:", e);
      const relationLine = themPillars
        ? `나 ${mePillars.day.stem.han} × 상대 ${themPillars.day.stem.han}` : undefined;
      reading = generateDummyReading(input.category, countOhaeng(mePillars), { relationLine });
      if (input.category === "relationship" && themPillars) {
        reading.ohaeng_note = describeRelation(mePillars.day, themPillars.day);
      }
    }

    await supabase.from("results").update({ reading, status: "ready" }).eq("id", row.id);
    return NextResponse.json({ id: row.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "풀이 생성에 실패했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/api/
git commit -m "feat: generate-result API route (claude + dummy fallback + supabase)"
```

---

## Task 17: 입력 → API → 결과 (DB 버전으로 전환)

**Files:**
- Modify: `src/app/check/[category]/page.tsx`
- Modify: `src/app/result/[id]/page.tsx`

- [ ] **Step 1: 입력 페이지 — sessionStorage 대신 API 호출**

`src/app/check/[category]/page.tsx`의 `submit` 함수와 로딩 상태 교체:
```tsx
// 상단 useState에 추가:
const [loading, setLoading] = useState(false);

// submit 교체:
const submit = async () => {
  setLoading(true);
  const input: CheckInput = { category, me, ...(twoPerson ? { them } : {}) };
  try {
    const res = await fetch("/api/generate-result", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("failed");
    const { id } = await res.json();
    router.push(`/result/${id}`);
  } catch {
    alert("풀이 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
    setLoading(false);
  }
};
```
그리고 `if (!isCategory(...))` 분기 바로 아래에 로딩 화면 추가:
```tsx
if (loading) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-xl text-fg">사주를 풀어보는 중…</p>
      <p className="mt-2 text-sm text-muted">최대 30초 정도 걸려요</p>
    </main>
  );
}
```

- [ ] **Step 2: 결과 페이지 — DB fetch + 폴링으로 전환**

`src/app/result/[id]/page.tsx`의 `useEffect` 블록을 sessionStorage 대신 Supabase에서 읽도록 교체:
```tsx
// import 추가:
import { supabaseClient } from "@/lib/supabase";

// useEffect 교체:
useEffect(() => {
  let cancelled = false;
  async function load() {
    const { data, error } = await supabaseClient
      .from("results")
      .select("category, me_pillars, them_pillars, reading, status")
      .eq("id", id).maybeSingle();
    if (error || !data) { router.replace("/not-found"); return; }
    if (data.status !== "ready" || !data.reading) {
      if (!cancelled) setTimeout(load, 1000);  // 생성 중 → 재시도
      return;
    }
    const mePillars = data.me_pillars as SajuPillars;
    const themPillars = (data.them_pillars as SajuPillars | null) ?? null;
    if (!cancelled) setView({
      category: data.category,
      mePillars, themPillars,
      meOhaeng: countOhaeng(mePillars),
      themOhaeng: themPillars ? countOhaeng(themPillars) : null,
      reading: data.reading as Reading,
      hourUnknown: !mePillars.hour || (!!themPillars && !themPillars.hour),
    });
  }
  load();
  return () => { cancelled = true; };
}, [id, router]);
```
> sessionStorage·`generateDummyReading`·`calculateSaju(input.me)` 호출은 결과 페이지에서 제거(이제 서버가 계산·풀이). `describeRelation` import도 제거 가능(서버가 ohaeng_note 채움).

- [ ] **Step 3: 로컬 검증 (.env.local 필요)**

Run: `npm run dev` → 전체 흐름. Supabase `results` 테이블에 row가 쌓이고, 결과가 LLM 풀이로 뜨면 OK. 키 없이 돌리면 500 — 이때는 Phase 1(sessionStorage) 커밋으로 데모.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/check/[category]/page.tsx" "src/app/result/[id]/page.tsx"
git commit -m "feat: wire input->API->result via supabase with polling"
```

---

## Task 18: 최종 빌드 + 배포 검증

- [ ] **Step 1: 테스트 + 빌드**

Run: `npm run test:run && npm run build`
Expected: 모든 테스트 PASS, 빌드 성공.

- [ ] **Step 2: Vercel 환경변수 확인 후 배포**

Vercel Settings → Environment Variables에 4개 키가 있는지 확인 후:
```bash
git push
```
Expected: 자동 재배포. 배포 URL에서 5개 카테고리 × (시 미상/음력) 흐름 확인.

- [ ] **Step 3: 출시 후 수동 QA 체크**

- 5개 카테고리 각각 풀이가 사주에 근거 있는가
- 모바일 가독성 (게이지·그래프·카드)
- 로딩 30초 이내
- 음력/윤달 입력 정확성
- 잘못된 id → /not-found

---

## v2로 미루는 것 (YAGNI)

회원가입·결제, 공유/OG 이미지, 다국어, 알림, 십성·대운·신살, 데일리 운세, 결과 영구 저장(현행 7일 TTL), 7일 TTL 자동 삭제 크론.
