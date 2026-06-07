# AI 풀이 (기본 결과 + 한 입 더) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결정론적 더미였던 기본 풀이와 "한 입 더"를 실제 Claude(Sonnet 4.6) 명리학 해석으로 교체하되, 점수·오행·기둥은 계산으로 고정하고 키 없음/실패 시 더미로 폴백한다.

**Architecture:** 브라우저가 사주 사실(기둥·오행·점수)을 계산해 `POST /api/reading`으로 보내면, 서버 라우트가 `reading-ai.ts`(Claude 호출 격리 + structured output)로 풀이 문장을 생성해 `{ reading, deep }`를 돌려준다. 라우트는 키 없음/예외 시 기존 더미로 폴백하므로 항상 유효한 응답을 보장한다. 클라이언트는 입력 해시로 `sessionStorage` 캐시한다.

**Tech Stack:** Next.js 16 (App Router Route Handler) · TypeScript · `@anthropic-ai/sdk`(설치됨) · zod · vitest.

설계 정본: `docs/superpowers/specs/2026-06-07-ai-reading-design.md`

---

## 파일 구조

```
src/
├── lib/saju/
│   ├── reading-facts.ts        # [신규] ReadingFacts 타입 + zod 스키마 + buildFacts (순수)
│   ├── reading-facts.test.ts   # [신규]
│   ├── reading-prompt.ts       # [신규] buildSystemPrompt / buildUserPrompt (순수)
│   ├── reading-prompt.test.ts  # [신규]
│   ├── reading-ai.ts           # [신규] generateReading — Claude 호출 격리 (모델·프롬프트 유일 위치)
│   ├── reading-ai.test.ts      # [신규] SDK 모킹
│   ├── reading-deep.ts         # [변경 없음] generateDeepBite 폴백 유지
│   └── reading-dummy.ts        # [변경 없음] 폴백 유지
├── lib/
│   └── reading-cache.ts        # [신규] sessionStorage 캐시 키/조회/저장 (순수 + 브라우저)
├── app/
│   ├── api/reading/route.ts    # [신규] POST 핸들러 + 더미 폴백
│   └── result/[id]/page.tsx    # [수정] 동기 더미 → fetch + 캐시 + 로딩
└── components/
    └── deeper-reading.tsx      # [수정] AI deep 섹션 prop 수용, 없으면 generateDeepBite 폴백
```

각 파일 한 가지 책임: 사실 빌드 / 프롬프트 빌드 / 호출 격리 / 캐시 / 라우트 / 화면.

---

## 공통 타입 (Task 1에서 확정, 이후 전 태스크가 참조)

```ts
// reading-facts.ts 에서 export
export type ReadingFacts = {
  category: Category;                 // "general" | ... | "relationship"
  score: number;                      // 계산 고정값 (AI가 못 바꿈)
  meOhaeng: OhaengCount;              // { wood, fire, earth, metal, water }
  themOhaeng?: OhaengCount | null;   // relationship 일 때만
  relationLine?: string;             // relationship: "나 甲(갑) × 상대 丙(병)"
  relationOhaengNote?: string;       // relationship: describeRelation 결과
  hourUnknown: boolean;
};
```

`reading-ai.generateReading(facts)` 와 라우트는 `{ reading: Reading, deep: DeepReading }` 를 반환한다(`Reading`은 `@/lib/schema`, `DeepReading`은 `@/lib/saju/reading-deep`).

---

### Task 1: ReadingFacts 타입 + zod 스키마 + buildFacts

**Files:**
- Create: `src/lib/saju/reading-facts.ts`
- Test: `src/lib/saju/reading-facts.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/saju/reading-facts.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { ReadingFactsSchema } from "./reading-facts";

const base = {
  category: "general",
  score: 72,
  meOhaeng: { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 },
  hourUnknown: false,
};

describe("ReadingFactsSchema", () => {
  it("유효한 1인 사실을 통과시킨다", () => {
    expect(ReadingFactsSchema.parse(base)).toMatchObject({ category: "general", score: 72 });
  });

  it("관계 궁합 사실(상대 오행 포함)을 통과시킨다", () => {
    const rel = {
      ...base,
      category: "relationship",
      themOhaeng: { wood: 1, fire: 1, earth: 2, metal: 2, water: 1 },
      relationLine: "나 甲(갑) × 상대 丙(병)",
      relationOhaengNote: "목생화 — 따뜻하게 키워주는 관계",
    };
    expect(ReadingFactsSchema.parse(rel).themOhaeng).toBeTruthy();
  });

  it("score 범위를 벗어나면 거부한다", () => {
    expect(() => ReadingFactsSchema.parse({ ...base, score: 130 })).toThrow();
  });

  it("알 수 없는 카테고리를 거부한다", () => {
    expect(() => ReadingFactsSchema.parse({ ...base, category: "nope" })).toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- reading-facts`
Expected: FAIL — "Cannot find module './reading-facts'"

- [ ] **Step 3: 구현 작성**

`src/lib/saju/reading-facts.ts`:
```ts
import { z } from "zod";
import { Category, CATEGORY_KEYS } from "../categories";
import { OhaengCount } from "./data";

const OhaengCountSchema = z.object({
  wood: z.number(), fire: z.number(), earth: z.number(),
  metal: z.number(), water: z.number(),
});

export const ReadingFactsSchema = z.object({
  category: z.enum(CATEGORY_KEYS as [Category, ...Category[]]),
  score: z.number().int().min(0).max(100),
  meOhaeng: OhaengCountSchema,
  themOhaeng: OhaengCountSchema.nullable().optional(),
  relationLine: z.string().optional(),
  relationOhaengNote: z.string().optional(),
  hourUnknown: z.boolean(),
});

export type ReadingFacts = z.infer<typeof ReadingFactsSchema>;
```

> 참고: `OhaengCount` 는 `@/lib/saju/data` 의 `Record<Ohaeng, number>`. import 만 하고 직접 쓰지 않아도 타입 일관성 확인용으로 남겨도 되고, 미사용이면 빼도 된다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- reading-facts`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/saju/reading-facts.ts src/lib/saju/reading-facts.test.ts
git commit -m "feat: ReadingFacts 타입 + zod 스키마"
```

---

### Task 2: 프롬프트 빌더 (명리학 + 톤 규칙)

**Files:**
- Create: `src/lib/saju/reading-prompt.ts`
- Test: `src/lib/saju/reading-prompt.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/saju/reading-prompt.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserPrompt } from "./reading-prompt";
import type { ReadingFacts } from "./reading-facts";

const facts: ReadingFacts = {
  category: "love",
  score: 68,
  meOhaeng: { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 },
  hourUnknown: false,
};

describe("buildSystemPrompt", () => {
  it("톤·금지어 규칙을 담는다", () => {
    const s = buildSystemPrompt();
    expect(s).toContain("명리");          // 명리학 해석가 역할
    expect(s).toMatch(/용어.*노출|노출.*않/); // 용어 비노출 규칙
    expect(s).toContain("점수");          // 점수 변경 금지
  });
});

describe("buildUserPrompt", () => {
  it("카테고리·점수·오행 분포를 담는다", () => {
    const u = buildUserPrompt(facts);
    expect(u).toContain("연애");           // 카테고리 한글명
    expect(u).toContain("68");             // 점수
    expect(u).toMatch(/목|화|토|금|수/);   // 오행 분포(한글)
  });

  it("관계 궁합이면 상대 정보를 담는다", () => {
    const u = buildUserPrompt({
      ...facts,
      category: "relationship",
      themOhaeng: { wood: 1, fire: 1, earth: 2, metal: 2, water: 1 },
      relationLine: "나 甲(갑) × 상대 丙(병)",
      relationOhaengNote: "목생화 — 따뜻하게 키워주는 관계",
    });
    expect(u).toContain("상대");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- reading-prompt`
Expected: FAIL — module 없음

- [ ] **Step 3: 구현 작성**

`src/lib/saju/reading-prompt.ts`:
```ts
import { getCategory } from "../categories";
import type { ReadingFacts } from "./reading-facts";

const KO_OHAENG: Record<string, string> = {
  wood: "목(나무)", fire: "화(불)", earth: "토(흙)", metal: "금(쇠)", water: "수(물)",
};

const CATEGORY_FOCUS: Record<string, string> = {
  general: "타고난 기운의 전체 균형과 성향",
  love: "지금의 연애 흐름과 마음의 결",
  wealth: "돈과 기회를 보는 감각, 재물의 흐름",
  health: "몸과 컨디션, 에너지의 리듬",
  relationship: "두 사람 사이의 합과 결, 관계의 온도",
};

export function buildSystemPrompt(): string {
  return [
    "당신은 따뜻한 명리학 해석가입니다. 사용자의 사주(천간·지지 기둥과 오행 분포)를 명리학 규칙으로 해석합니다.",
    "",
    "규칙:",
    "1. 말투는 다정한 '오늘의 운세'체입니다. '~하네요', '~하길 바랍니다'처럼 부드럽게.",
    "2. 명리 용어를 절대 표면에 노출하지 마세요. '수생목', '비겁', '식상', '편관', '상생/상극', 'wood/fire' 같은 단어 금지. 해석은 내부에서만 하고, 사용자에겐 쉬운 일상어 문장으로만 전달합니다.",
    "3. 점수(score)는 이미 계산되어 주어집니다. 그 숫자를 바꾸지 말고, 그 점수와 어울리는 톤으로 풀이하세요.",
    "4. 신비주의·겁주기 없이 진지하고 다정하게. 단정이 아니라 흐름과 방향을 이야기합니다.",
    "5. 모든 출력은 한국어입니다.",
  ].join("\n");
}

export function buildUserPrompt(facts: ReadingFacts): string {
  const cat = getCategory(facts.category);
  const ohaeng = (c: ReadingFacts["meOhaeng"]) =>
    (Object.keys(KO_OHAENG) as (keyof typeof c)[])
      .map((k) => `${KO_OHAENG[k]} ${c[k]}`).join(", ");

  const lines = [
    `카테고리: ${cat.name} — 초점: ${CATEGORY_FOCUS[facts.category]}`,
    `점수: ${facts.score} (이 숫자는 고정, 바꾸지 마세요)`,
    `내 오행 분포: ${ohaeng(facts.meOhaeng)}`,
  ];
  if (facts.hourUnknown) lines.push("참고: 태어난 시각 미상 — 단정적이지 않게 풀이하세요.");
  if (facts.category === "relationship" && facts.themOhaeng) {
    lines.push(`상대 오행 분포: ${ohaeng(facts.themOhaeng)}`);
    if (facts.relationLine) lines.push(`두 사람: ${facts.relationLine}`);
    if (facts.relationOhaengNote) lines.push(`관계의 결(내부 참고): ${facts.relationOhaengNote}`);
  }
  lines.push("", "위 사주를 바탕으로 풀이를 생성하세요.");
  return lines.join("\n");
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- reading-prompt`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/saju/reading-prompt.ts src/lib/saju/reading-prompt.test.ts
git commit -m "feat: 명리학 풀이 프롬프트 빌더 (톤·용어 비노출 규칙)"
```

---

### Task 3: reading-ai.generateReading (Claude 호출 격리 + SDK 모킹 테스트)

**Files:**
- Create: `src/lib/saju/reading-ai.ts`
- Test: `src/lib/saju/reading-ai.test.ts`

핵심 책임: Claude 호출, structured output 파싱, **점수/관계 필드를 계산값으로 덮어쓰기**, `{ reading, deep }` 반환. 모델 상수(`claude-sonnet-4-6`)가 사는 유일한 파일.

- [ ] **Step 1: 실패 테스트 작성 (SDK 모킹)**

`src/lib/saju/reading-ai.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Anthropic SDK 모킹: messages.parse 만 사용
const parseMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse: parseMock };
  },
}));

import { generateReading } from "./reading-ai";
import type { ReadingFacts } from "./reading-facts";

const aiOutput = {
  score: 5, // 일부러 틀린 값 — 덮어써져야 함
  headline: "먼저 다가갈수록 풀리는 시기예요",
  ohaeng_note: "표현하는 기운이 강해 마음이 잘 드러나요.",
  strengths: [
    { title: "표현력", detail: "마음을 솔직하게 드러내는 힘이 있어요. 그게 관계에서 강점이 됩니다." },
    { title: "회복력", detail: "감정의 출렁임이 있어도 스스로 균형을 되찾는 편이에요." },
  ],
  cautions: [{ title: "조급함 주의", detail: "서두르면 아쉬움이 남을 수 있어요. 한 박자 쉬어가세요." }],
  advice: "오늘 한 가지만 정해 작게 표현해보세요. 흐름이 한결 부드러워집니다.",
  deep_sections: [
    { title: "요즘 당신의 흐름", body: "마음이 먼저 움직이는 시기예요. 표현하는 힘이 잘 살아나는 때라 솔직함이 통합니다." },
    { title: "이런 결정이 잘 맞아요", body: "익숙하고 잘하는 영역에서 한 걸음 더 나아가 보세요. 새로 벌이기보다 또렷하게 마무리하는 쪽이 좋아요." },
  ],
};

const facts: ReadingFacts = {
  category: "love",
  score: 68,
  meOhaeng: { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 },
  hourUnknown: false,
};

beforeEach(() => {
  parseMock.mockReset();
  process.env.ANTHROPIC_API_KEY = "test-key";
});

describe("generateReading", () => {
  it("AI 점수를 계산값으로 덮어쓴다", async () => {
    parseMock.mockResolvedValue({ parsed_output: aiOutput });
    const { reading } = await generateReading(facts);
    expect(reading.score).toBe(68);          // 5 가 아니라 facts.score
  });

  it("기본 풀이와 한 입 더를 함께 반환한다", async () => {
    parseMock.mockResolvedValue({ parsed_output: aiOutput });
    const { reading, deep } = await generateReading(facts);
    expect(reading.headline.length).toBeGreaterThan(3);
    expect(deep.sections.length).toBeGreaterThanOrEqual(2);
  });

  it("관계 궁합이면 relation_line·ohaeng_note를 계산값으로 세팅한다", async () => {
    parseMock.mockResolvedValue({ parsed_output: aiOutput });
    const { reading } = await generateReading({
      ...facts,
      category: "relationship",
      themOhaeng: { wood: 1, fire: 1, earth: 2, metal: 2, water: 1 },
      relationLine: "나 甲(갑) × 상대 丙(병)",
      relationOhaengNote: "목생화 — 따뜻하게 키워주는 관계",
    });
    expect(reading.relation_line).toBe("나 甲(갑) × 상대 丙(병)");
    expect(reading.ohaeng_note).toBe("목생화 — 따뜻하게 키워주는 관계");
  });

  it("parsed_output 이 없으면 throw 한다 (라우트가 폴백하도록)", async () => {
    parseMock.mockResolvedValue({ parsed_output: null });
    await expect(generateReading(facts)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- reading-ai`
Expected: FAIL — module 없음

- [ ] **Step 3: 구현 작성**

`src/lib/saju/reading-ai.ts`:
```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ReadingSchema, Reading } from "../schema";
import { DeepReading } from "./reading-deep";
import { ReadingFacts } from "./reading-facts";
import { buildSystemPrompt, buildUserPrompt } from "./reading-prompt";

const MODEL = "claude-sonnet-4-6"; // 모델 교체는 이 한 줄

// 기본 풀이 + 한 입 더를 한 번에 받는 출력 스키마
const AIReadingSchema = ReadingSchema.extend({
  deep_sections: z
    .array(z.object({ title: z.string().min(2).max(24), body: z.string().min(20).max(400) }))
    .min(2)
    .max(3),
});

export async function generateReading(
  facts: ReadingFacts
): Promise<{ reading: Reading; deep: DeepReading }> {
  const client = new Anthropic(); // ANTHROPIC_API_KEY 환경변수 사용

  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(facts) }],
    output_config: { format: zodOutputFormat(AIReadingSchema, "reading") },
  });

  const out = res.parsed_output;
  if (!out) throw new Error("AI 풀이 파싱 실패");

  const { deep_sections, ...readingPart } = out;
  const reading: Reading = { ...readingPart, score: facts.score }; // 점수 고정

  if (facts.category === "relationship") {
    if (facts.relationLine) reading.relation_line = facts.relationLine;
    if (facts.relationOhaengNote) reading.ohaeng_note = facts.relationOhaengNote;
  }

  return { reading, deep: { sections: deep_sections } };
}
```

> **호환 주의:** `zodOutputFormat` 은 `@anthropic-ai/sdk/helpers/zod` 경로. zod v4와 SDK 0.95 조합에서 import 가 안 되면, 대체로 `output_config: { format: { type: "json_schema", schema: <수기 JSON 스키마> } }` 를 쓰고 `res.content` 의 텍스트 블록을 `JSON.parse` 후 `AIReadingSchema.parse(...)` 로 검증한다. 테스트는 `parse` 모킹이라 어느 쪽이든 통과.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- reading-ai`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/saju/reading-ai.ts src/lib/saju/reading-ai.test.ts
git commit -m "feat: reading-ai generateReading (Claude 호출 격리, 점수 고정)"
```

---

### Task 4: 서버 라우트 /api/reading + 더미 폴백

**Files:**
- Create: `src/app/api/reading/route.ts`

라우트는 항상 유효한 `{ reading, deep }` 를 반환한다: 키 없음/예외 시 더미.

- [ ] **Step 1: Next 16 Route Handler 규약 확인**

Run: `ls node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route.mdx 2>/dev/null || ls node_modules/next/dist/docs/01-app`
목적: App Router Route Handler 시그니처(`export async function POST(request: Request)`, `Response.json(...)`)가 현재 Next 16에서 유효한지 확인. AGENTS.md 경고대로 학습 데이터와 다를 수 있으니 한 번 본다.

- [ ] **Step 2: 구현 작성**

`src/app/api/reading/route.ts`:
```ts
import { ReadingFactsSchema } from "@/lib/saju/reading-facts";
import { generateReading } from "@/lib/saju/reading-ai";
import { generateDummyReading } from "@/lib/saju/reading-dummy";
import { generateDeepBite } from "@/lib/saju/reading-deep";

export async function POST(request: Request) {
  let facts;
  try {
    facts = ReadingFactsSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid facts" }, { status: 400 });
  }

  // 키 없으면 호출 없이 더미
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(dummy(facts));
  }

  try {
    const result = await generateReading(facts);
    return Response.json(result);
  } catch (e) {
    console.error("[/api/reading] AI 실패, 더미 폴백:", e);
    return Response.json(dummy(facts));
  }
}

function dummy(facts: ReturnType<typeof ReadingFactsSchema.parse>) {
  const reading = generateDummyReading(facts.category, facts.meOhaeng, {
    relationLine: facts.relationLine,
  });
  reading.score = facts.score;
  if (facts.category === "relationship" && facts.relationOhaengNote) {
    reading.ohaeng_note = facts.relationOhaengNote;
  }
  return { reading, deep: generateDeepBite(facts.category, facts.meOhaeng) };
}
```

- [ ] **Step 3: 빌드로 라우트 컴파일 확인**

Run: `npm run build`
Expected: 빌드 성공, 출력에 `/api/reading` 라우트가 잡힘 (에러 없음)

- [ ] **Step 4: 키 없는 상태에서 더미 폴백 수동 확인**

Run (별도 터미널): `npm run dev`
그다음:
```bash
curl -s -X POST http://localhost:3000/api/reading \
  -H "content-type: application/json" \
  -d '{"category":"general","score":72,"meOhaeng":{"wood":3,"fire":2,"earth":1,"metal":0,"water":2},"hourUnknown":false}'
```
Expected: `{ "reading": { "score":72, "headline": ... }, "deep": { "sections":[...] } }` (키 미설정이므로 더미 내용)

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/reading/route.ts
git commit -m "feat: /api/reading 라우트 + 더미 폴백"
```

---

### Task 5: 브라우저 캐시 헬퍼

**Files:**
- Create: `src/lib/reading-cache.ts`
- Test: `src/lib/reading-cache.test.ts`

입력(CheckInput)이 같으면 같은 키 → `sessionStorage` 재사용.

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/reading-cache.test.ts`:
```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- reading-cache`
Expected: FAIL — module 없음

- [ ] **Step 3: 구현 작성**

`src/lib/reading-cache.ts`:
```ts
import type { CheckInput } from "@/types";

/** 입력을 안정적으로 직렬화해 캐시 키 생성 (같은 생일·카테고리 = 같은 키) */
export function readingCacheKey(input: CheckInput): string {
  const norm = (p: CheckInput["me"]) =>
    [p.year, p.month, p.day, p.hour, p.minute, p.isLunar, p.isLeapMonth].join("|");
  const parts = [input.category, norm(input.me), input.them ? norm(input.them) : ""];
  return "reading:" + parts.join("::");
}

type Cached = { reading: import("@/lib/schema").Reading; deep: import("@/lib/saju/reading-deep").DeepReading };

export function readCache(input: CheckInput): Cached | null {
  try {
    const raw = sessionStorage.getItem(readingCacheKey(input));
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

export function writeCache(input: CheckInput, value: Cached): void {
  try {
    sessionStorage.setItem(readingCacheKey(input), JSON.stringify(value));
  } catch {
    /* 용량 초과 등은 무시 (캐시는 부가기능) */
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- reading-cache`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/reading-cache.ts src/lib/reading-cache.test.ts
git commit -m "feat: 풀이 sessionStorage 캐시 헬퍼"
```

---

### Task 6: DeeperReading — AI 섹션 prop 수용 (폴백 유지)

**Files:**
- Modify: `src/components/deeper-reading.tsx`

`deep` prop 이 오면 그걸 쓰고, 없으면 기존 `generateDeepBite` 폴백(하위호환).

- [ ] **Step 1: 구현 수정**

`src/components/deeper-reading.tsx` 의 함수 시그니처와 첫 줄을 교체:
```tsx
import { Category } from "@/lib/categories";
import { OhaengCount } from "@/lib/saju/data";
import { generateDeepBite, DeepReading } from "@/lib/saju/reading-deep";

export function DeeperReading({
  category,
  count,
  deep,
}: {
  category: Category;
  count: OhaengCount;
  deep?: DeepReading;
}) {
  const sections = (deep ?? generateDeepBite(category, count)).sections;
  return (
    <div className="space-y-3">
      <details className="rounded-2xl border border-border bg-card shadow-sm">
        <summary className="cursor-pointer list-none p-4 text-base font-bold text-accent">
          🥢 한 입 더 <span className="text-xs font-normal text-muted">— 무료로 더 깊은 풀이 보기</span>
        </summary>
        <div className="space-y-4 px-4 pb-4">
          {sections.map((s, i) => (
            <section key={i}>
              <h4 className="text-sm font-bold text-fg">{s.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-fg/90">{s.body}</p>
            </section>
          ))}
        </div>
      </details>

      <div className="rounded-2xl border border-dashed border-accent/40 bg-accent-soft p-4 text-center">
        <p className="font-bold text-accent">🍱 사주 한 상 (정식 풀이)</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          곧 만나요 — 올해 흐름과 시기별 운까지 한 상 가득 차려드릴게요. (준비 중)
        </p>
      </div>
    </div>
  );
}
```

> `DeepReading` 타입이 `reading-deep.ts` 에서 export 되는지 확인(현재 `export type DeepReading = ...` 됨 — 맞음).

- [ ] **Step 2: 기존 테스트·타입 회귀 확인**

Run: `npm run test:run`
Expected: 기존 테스트 전부 PASS (DeeperReading 은 prop 옵셔널이라 기존 호출도 유효)

- [ ] **Step 3: 커밋**

```bash
git add src/components/deeper-reading.tsx
git commit -m "feat: DeeperReading AI deep 섹션 prop 수용 (폴백 유지)"
```

---

### Task 7: result 페이지 — 동기 더미 → fetch + 캐시 + 로딩

**Files:**
- Modify: `src/app/result/[id]/page.tsx`

계산(기둥·오행·점수)은 클라이언트 유지. 풀이는 캐시 → fetch → (네트워크 실패 시) 로컬 더미.

- [ ] **Step 1: import 교체/추가**

`src/app/result/[id]/page.tsx` 상단 import 에 추가:
```tsx
import { scoreFromOhaeng, generateDummyReading } from "@/lib/saju/reading-dummy";
import { ReadingFacts } from "@/lib/saju/reading-facts";
import { DeepReading, generateDeepBite } from "@/lib/saju/reading-deep";
import { readCache, writeCache } from "@/lib/reading-cache";
```
(기존 `generateDummyReading` import 줄은 위로 합쳐 한 줄로.)

- [ ] **Step 2: View 타입에 deep 추가**

`type View` 에 필드 추가:
```tsx
  reading: Reading;
  deep: DeepReading;
  hourUnknown: boolean;
```

- [ ] **Step 3: useEffect 본문을 async fetch + 캐시로 교체**

기존 `useEffect`(동기 `generateDummyReading` 호출 부분)를 아래로 교체:
```tsx
  useEffect(() => {
    const raw = sessionStorage.getItem(`saju:${id}`);
    if (!raw) { router.replace("/not-found"); return; }
    const input: CheckInput = JSON.parse(raw);

    const mePillars = calculateSaju(input.me);
    const meOhaeng = countOhaeng(mePillars);
    const themPillars = input.them ? calculateSaju(input.them) : null;
    const themOhaeng = themPillars ? countOhaeng(themPillars) : null;
    const score = scoreFromOhaeng(meOhaeng, input.category);
    const relationLine = themPillars
      ? `나 ${mePillars.day.stem.han}(${mePillars.day.stem.ko}) × 상대 ${themPillars.day.stem.han}(${themPillars.day.stem.ko})`
      : undefined;
    const relationOhaengNote = themPillars
      ? describeRelation(mePillars.day, themPillars.day)
      : undefined;
    const hourUnknown =
      input.me.hour === null || (!!input.them && input.them.hour === null);

    const baseView = { category: input.category, mePillars, themPillars, meOhaeng, themOhaeng, hourUnknown };

    // 1) 캐시 우선
    const cached = readCache(input);
    if (cached) { setView({ ...baseView, ...cached }); return; }

    // 2) 서버 라우트
    const facts: ReadingFacts = {
      category: input.category, score, meOhaeng,
      themOhaeng, relationLine, relationOhaengNote, hourUnknown,
    };
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reading", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(facts),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json() as { reading: Reading; deep: DeepReading };
        if (cancelled) return;
        writeCache(input, data);
        setView({ ...baseView, ...data });
      } catch {
        // 3) 네트워크 실패 → 로컬 더미 폴백
        if (cancelled) return;
        const reading = generateDummyReading(input.category, meOhaeng, { relationLine });
        reading.score = score;
        if (input.category === "relationship" && relationOhaengNote) reading.ohaeng_note = relationOhaengNote;
        setView({ ...baseView, reading, deep: generateDeepBite(input.category, meOhaeng) });
      }
    })();
    return () => { cancelled = true; };
  }, [id, router]);
```

- [ ] **Step 4: 렌더에서 deep 을 DeeperReading 에 전달**

`<DeeperReading category={view.category} count={view.meOhaeng} />` →
```tsx
      <DeeperReading category={view.category} count={view.meOhaeng} deep={view.deep} />
```
로딩 문구는 기존 `if (!view) return <div ...>풀이 불러오는 중…</div>;` 를:
```tsx
  if (!view) return <div className="p-12 text-center text-muted">풀이 우려내는 중…</div>;
```

- [ ] **Step 5: 빌드 + 타입 확인**

Run: `npm run build`
Expected: 빌드 성공 (타입 에러 없음)

- [ ] **Step 6: 수동 확인 (키 없이 = 더미 경로)**

`npm run dev` → 홈에서 생일 입력 → 결과 페이지가 "풀이 우려내는 중…" 후 더미 풀이 렌더, "한 입 더" 펼침 동작. 새로고침 시 캐시로 즉시 렌더.

- [ ] **Step 7: 커밋**

```bash
git add src/app/result/[id]/page.tsx
git commit -m "feat: result 페이지 AI 풀이 fetch + 캐시 + 로딩"
```

---

### Task 8: 환경변수 문서화 + 실제 키 QA

**Files:**
- Create: `.env.local.example`
- Modify: `README.md` (로컬 실행 섹션에 키 안내 한 줄)

- [ ] **Step 1: `.env.local.example` 작성**

`.env.local.example`:
```
# Claude 풀이 호출용. 없으면 결정론적 더미 풀이로 동작.
# 발급: https://console.anthropic.com  → Vercel 환경변수에도 동일 키 등록.
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 2: README 로컬 실행 섹션 보강**

`README.md` 의 "로컬 실행" 코드블록 아래에 추가:
```markdown
> AI 풀이를 쓰려면 `ANTHROPIC_API_KEY`를 `.env.local`에 넣으세요(`.env.local.example` 참고). 키가 없으면 결정론적 더미 풀이로 동작합니다.
```

- [ ] **Step 3: 실제 키로 통합 확인**

`.env.local` 에 실제 키 설정 → `npm run dev` → 결과 페이지에서:
- 풀이가 더미 고정 문구와 **다른**(생성된) 문장인지 확인
- 점수가 게이지와 일치(= 계산값)인지
- "한 입 더" 섹션 내용이 생성된 것인지
- 명리 용어("수생목" 등)·영어 오행 키가 표면에 없는지
- 새로고침 시 캐시로 즉시(재호출 없음) 뜨는지 (Network 탭에서 /api/reading 미호출)

- [ ] **Step 4: 전체 테스트 + 빌드 최종 확인**

Run: `npm run test:run && npm run build`
Expected: 전체 테스트 PASS, 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add .env.local.example README.md
git commit -m "docs: ANTHROPIC_API_KEY 설정 안내 + .env.local.example"
```

---

## Self-Review 메모 (작성자 점검 완료)

- **스펙 커버리지:** §2 흐름→Task 4·7, §3 컴포넌트→Task 1~7 각각 매핑, §4 스키마→Task 3, §5 톤 규칙→Task 2, §6 환경변수→Task 8, §7 폴백→Task 4(라우트)·Task 7(네트워크 실패), §8 테스트→각 Task의 테스트 단계. 오늘의 한 입 제외는 의도(§9).
- **타입 일관성:** `ReadingFacts`(Task1) → reading-prompt(Task2)·reading-ai(Task3)·route(Task4)·result(Task7) 동일 사용. `{ reading, deep }` 반환형이 reading-ai·route·cache·result에서 일치. `DeepReading` export 확인.
- **폴백 경로 3중:** 키 없음(라우트) / AI 예외(라우트) / 네트워크 실패(클라이언트). 모두 더미 + 계산 점수 유지.
- **알려진 리스크:** `zodOutputFormat` import 경로 호환 — Task 3 Step 3에 대체안(수기 JSON 스키마) 명시. Next 16 Route Handler 규약 — Task 4 Step 1에서 docs 확인 후 진행.
