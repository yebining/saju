# 종합 사주 v2 (정확한 계산 + 9섹션 풀이 + 영구 저장) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 진태양시 보정으로 사주 계산을 표준화하고, 실제 8글자·대운을 Gemini에 넘겨 종합 사주를 9섹션 풍성한 풀이로 만들고, Supabase에 저장해 "같은 사람=항상 같은 결과"로 고정한다.

**Architecture:** 브라우저가 보정된 기둥·오행·점수·대운을 계산해 서버 라우트로 보내면, 라우트가 Supabase에서 기존 풀이를 찾아 있으면 그대로, 없으면 Gemini로 9섹션 생성 후 저장한다. 종합(general)만 Rich, 나머지 카테고리는 현행 유지. 키/DB 없으면 더미 폴백.

**Tech Stack:** Next.js 16 · TypeScript · lunar-javascript(전체 any 타입) · @google/genai(2.8.0, gemini-2.5-flash) · @supabase/supabase-js(설치됨) · zod · vitest.

설계 정본: `docs/superpowers/specs/2026-06-07-rich-reading-v2-design.md`

**3단계로 배포**: Phase 1(보정, Task 1)만 먼저 배포해도 오행 문제 해결. Phase 2(9섹션, Task 2~7), Phase 3(Supabase, Task 8~10).

---

## 파일 구조

```
src/
├── lib/saju/
│   ├── calculate.ts          # [수정] 진태양시 보정 + buildEightChar export
│   ├── calculate.test.ts     # [수정] 보정 검증 추가
│   ├── daeun.ts              # [신규] 대운 계산
│   ├── daeun.test.ts         # [신규]
│   ├── reading-facts.ts      # [수정] RichFacts 타입/스키마 추가
│   ├── reading-prompt.ts     # [수정] buildRichSystemPrompt/buildRichUserPrompt
│   ├── reading-prompt.test.ts# [수정]
│   ├── reading-ai.ts         # [수정] generateRichReading(종합) + temperature
│   └── reading-ai.test.ts    # [수정]
├── lib/
│   ├── schema.ts             # [수정] RichReadingSchema 추가
│   ├── schema.test.ts        # [수정]
│   └── supabase.ts           # [신규] 서버 전용 클라이언트 + get/store
├── app/api/reading/route.ts  # [수정] 종합=Rich, Supabase 조회/저장
├── components/
│   └── rich-reading.tsx      # [신규] 9섹션 렌더
└── app/result/[id]/page.tsx  # [수정] 종합이면 Rich fetch/렌더
```

---

# PHASE 1 — 진태양시 보정 (먼저 배포)

### Task 1: calculate.ts 진태양시 보정

**Files:**
- Modify: `src/lib/saju/calculate.ts`
- Modify: `src/lib/saju/calculate.test.ts`

- [ ] **Step 1: 기존 테스트 확인**

Run: `npm run test:run -- calculate`
기존 테스트가 보정 안 된 시주를 단정하면, 이번 변경으로 깨질 수 있다. 출력을 보고 어떤 단정이 있는지 파악(있으면 Step 4에서 보정값으로 갱신).

- [ ] **Step 2: 실패 테스트 추가 — `src/lib/saju/calculate.test.ts` 에 append**

```ts
import { describe, it, expect } from "vitest";
import { calculateSaju, countOhaeng } from "./calculate";

describe("진태양시 보정", () => {
  // 1999-08-19 01:02(양력)은 시 경계(01:00) 직후 → 보정 시 子시(수)
  const me = { year: 1999, month: 8, day: 19, hour: 1, minute: 2, isLunar: false, isLeapMonth: false };

  it("시주가 경도 보정으로 壬子가 된다(癸丑 아님)", () => {
    const p = calculateSaju(me);
    expect(p.hour!.stem.han).toBe("壬");
    expect(p.hour!.branch.han).toBe("子");
  });

  it("오행이 표준과 일치한다 (목2 화0 토1 금1 수4)", () => {
    expect(countOhaeng(calculateSaju(me))).toEqual({ wood: 2, fire: 0, earth: 1, metal: 1, water: 4 });
  });

  it("시 미상이면 보정과 무관하게 연·월·일 기둥만 안정적", () => {
    const noHour = { ...me, hour: null, minute: null };
    const p = calculateSaju(noHour);
    expect(p.hour).toBeNull();
    expect(p.day.stem.han).toBe("癸"); // 일주는 보정과 무관(정오 기준)
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm run test:run -- calculate`
Expected: "진태양시 보정" 테스트 FAIL (현재는 癸丑/토2수3 이 나옴)

- [ ] **Step 4: 구현 — `calculate.ts`**

`calculateSaju` 의 "2. 시간 정보 부여" 블록을 아래로 교체. 상단에 상수 추가, 그 외 함수/시그니처는 그대로.

상수 추가(파일 상단, import 아래):
```ts
// 진태양시 보정: 한국 표준시(동경 135°) → 출생지(서울 126.978°E) 태양시 ≈ -32분.
// (135 - 126.978) × 4분 ≈ 32.1 → 32분.
const SOLAR_TIME_OFFSET_MIN = 32;
```

"2. 시간 정보 부여" 블록 교체:
```ts
  // 2. 시간 정보 + 진태양시 보정 (시각을 아는 경우에만 보정; 모르면 정오 기준)
  let hour = input.hour ?? 12;
  let minute = input.minute ?? 0;
  let baseSolar = solar;
  if (input.hour !== null) {
    let total = hour * 60 + minute - SOLAR_TIME_OFFSET_MIN;
    let dayShift = 0;
    while (total < 0) { total += 1440; dayShift -= 1; }
    while (total >= 1440) { total -= 1440; dayShift += 1; }
    hour = Math.floor(total / 60);
    minute = total % 60;
    if (dayShift !== 0) baseSolar = solar.next(dayShift); // lunar-javascript Solar.next(days)
  }
  const solarWithTime = Solar.fromYmdHms(
    baseSolar.getYear(), baseSolar.getMonth(), baseSolar.getDay(), hour, minute, 0
  );
```

(이후 `eightChar = solarWithTime.getLunar().getEightChar()` 등은 그대로.)

- [ ] **Step 5: 테스트 통과 확인 + 회귀**

Run: `npm run test:run -- calculate` → 보정 테스트 PASS
Run: `npm run test:run` → 전체 통과. 기존 calculate 단정이 깨졌다면, 그 입력을 직접 계산해 보정값이 맞는지 확인 후 기댓값 갱신(보정이 정답).

- [ ] **Step 6: 빌드 + 커밋**

```bash
npm run build
git add src/lib/saju/calculate.ts src/lib/saju/calculate.test.ts
git commit -m "fix: 진태양시(경도) 보정 — 시주·오행 표준 일치"
```

> **여기서 Phase 1 배포 가능**: main 머지·push 하면 오행 문제 해결. (배포는 컨트롤러가 별도 판단)

---

# PHASE 2 — 9섹션 풍성 풀이

### Task 2: 대운 계산 (daeun.ts)

**Files:**
- Create: `src/lib/saju/daeun.ts`
- Test: `src/lib/saju/daeun.test.ts`

- [ ] **Step 1: 실패 테스트 — `src/lib/saju/daeun.test.ts`**

```ts
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
```

- [ ] **Step 2: 실패 확인** — `npm run test:run -- daeun`

- [ ] **Step 3: 구현 — `src/lib/saju/daeun.ts`**

```ts
import { Solar } from "lunar-javascript";
import { PersonInput } from "@/types";

export type DaeunPeriod = { startAge: number; endAge: number; startYear: number; ganzhi: string };

/** 대운(10년 주기) 계산. lunar-javascript EightChar.getYun(gender).getDaYun() 사용.
 *  간지가 빈(입운 전) 항목은 제외한다. */
export function computeDaeun(input: PersonInput): DaeunPeriod[] {
  // 양력 변환(음력이면) — calculate.ts와 동일 규약. 대운은 시각 영향이 작아 정오 기준으로 안정화.
  let solar;
  if (input.isLunar) {
    const { Lunar } = require("lunar-javascript");
    solar = Lunar.fromYmd(input.year, input.month, input.day).getSolar();
  } else {
    solar = Solar.fromYmd(input.year, input.month, input.day);
  }
  const ec = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 12, 0, 0)
    .getLunar().getEightChar();
  const gender = input.gender === "male" ? 1 : 0; // lunar-javascript: 1=남, 0=여
  const da = ec.getYun(gender).getDaYun();
  const out: DaeunPeriod[] = [];
  for (const d of da) {
    const ganzhi = d.getGanZhi();
    if (!ganzhi) continue; // 입운 전(빈 간지) 제외
    out.push({
      startAge: d.getStartAge(),
      endAge: d.getEndAge(),
      startYear: d.getStartYear(),
      ganzhi,
    });
  }
  return out;
}
```

> 참고: lunar-javascript는 전체 any 타입이라 위 메서드 호출은 타입 에러가 없다. `require`는 음력 분기에서만 사용(ESM 환경에서 Lunar 동적 접근). import 충돌 피하려 상단엔 Solar만 named import.

- [ ] **Step 4: 통과 확인** — `npm run test:run -- daeun` (PASS), 그다음 `npx tsc --noEmit`

- [ ] **Step 5: 커밋**

```bash
git add src/lib/saju/daeun.ts src/lib/saju/daeun.test.ts
git commit -m "feat: 대운(시기별) 계산 daeun.ts"
```

---

### Task 3: RichReadingSchema (schema.ts)

**Files:**
- Modify: `src/lib/schema.ts`
- Modify: `src/lib/schema.test.ts`

- [ ] **Step 1: 실패 테스트 — `src/lib/schema.test.ts` 에 append**

```ts
import { RichReadingSchema } from "./schema";

const validRich = {
  score: 72,
  headline: "타고난 결을 잘 살리는 사람이에요",
  me: "차분하면서도 속에 단단한 심지가 있는 분이에요. 자기 페이스를 지키며 꾸준히 나아가는 결이 강합니다.",
  strengths: [
    { title: "꾸준함", detail: "한번 정한 방향을 오래 밀고 가는 힘이 있어요. 시간이 지날수록 신뢰가 쌓입니다." },
    { title: "균형 감각", detail: "감정과 현실 사이에서 중심을 잘 잡아요. 흔들려도 금방 제자리를 찾습니다." },
  ],
  cautions: [{ title: "혼자 끌어안기", detail: "다 짊어지려다 지칠 수 있어요. 가끔은 기대도 괜찮습니다." }],
  charm: "은근히 사람을 편하게 만드는 매력이 있어요. 처음보다 알수록 끌리는 타입입니다.",
  life_flow: {
    early: "초년은 기초를 다지는 시기예요. 다양한 경험이 훗날 밑거름이 됩니다.",
    mid: "중년에 흐름이 트여요. 쌓아온 게 결실로 이어지는 때입니다.",
    late: "장년엔 안정과 영향력이 함께 와요. 주변을 이끄는 자리에 어울립니다.",
    senior: "말년은 여유로워요. 그동안의 결이 따뜻하게 돌아옵니다.",
  },
  love: "마음을 천천히 여는 편이에요. 진득하게 곁을 지키는 인연과 잘 맞습니다.",
  work_wealth: "꾸준히 쌓는 형의 재물운이에요. 한 분야를 깊게 파는 일이 잘 맞습니다.",
  health: "큰 무리는 없되 어깨·소화 쪽을 신경 쓰면 좋아요. 규칙적인 리듬이 보약입니다.",
  helpers: "묵묵히 도와주는 연상의 인연이 힘이 돼요. 오래된 사람을 소중히 하세요.",
  now_advice: "요즘은 벌이기보다 다지는 때예요. 오늘 한 가지만 또렷이 마무리해보세요.",
};

describe("RichReadingSchema", () => {
  it("유효한 9섹션 풀이를 통과시킨다", () => {
    expect(RichReadingSchema.parse(validRich).headline).toBeTruthy();
  });
  it("life_flow 4파트가 없으면 거부한다", () => {
    const bad = { ...validRich, life_flow: { early: "초년…초년…초년…", mid: "중년…중년…중년…" } };
    expect(() => RichReadingSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npm run test:run -- schema`

- [ ] **Step 3: 구현 — `src/lib/schema.ts` 에 append (기존 ReadingSchema 유지)**

```ts
const RichItem = z.object({
  title: z.string().min(2).max(24),
  detail: z.string().min(10).max(220),
});
const Section = z.string().min(30).max(260);

export const RichReadingSchema = z.object({
  score: z.number().int().min(0).max(100),
  headline: z.string().min(4).max(40),
  me: z.string().min(40).max(320),
  strengths: z.array(RichItem).min(2).max(3),
  cautions: z.array(RichItem).min(1).max(2),
  charm: Section,
  life_flow: z.object({
    early: z.string().min(20).max(220),
    mid: z.string().min(20).max(220),
    late: z.string().min(20).max(220),
    senior: z.string().min(20).max(220),
  }),
  love: Section,
  work_wealth: Section,
  health: Section,
  helpers: Section,
  now_advice: Section,
});

export type RichReading = z.infer<typeof RichReadingSchema>;
```

- [ ] **Step 4: 통과 확인** — `npm run test:run -- schema` (PASS) + `npx tsc --noEmit`

- [ ] **Step 5: 커밋**

```bash
git add src/lib/schema.ts src/lib/schema.test.ts
git commit -m "feat: RichReadingSchema (9섹션 종합 풀이 스키마)"
```

---

### Task 4: RichFacts 타입 + 풍성 프롬프트

**Files:**
- Modify: `src/lib/saju/reading-facts.ts`
- Modify: `src/lib/saju/reading-prompt.ts`
- Modify: `src/lib/saju/reading-prompt.test.ts`

- [ ] **Step 1: RichFacts 타입 추가 — `src/lib/saju/reading-facts.ts` 에 append**

```ts
import { DaeunPeriod } from "./daeun";

export type PillarFact = { stemHan: string; stemKo: string; branchHan: string; branchKo: string };

export const RichFactsSchema = ReadingFactsSchema.extend({
  pillars: z.object({
    year: z.object({ stemHan: z.string(), stemKo: z.string(), branchHan: z.string(), branchKo: z.string() }),
    month: z.object({ stemHan: z.string(), stemKo: z.string(), branchHan: z.string(), branchKo: z.string() }),
    day: z.object({ stemHan: z.string(), stemKo: z.string(), branchHan: z.string(), branchKo: z.string() }),
    hour: z.object({ stemHan: z.string(), stemKo: z.string(), branchHan: z.string(), branchKo: z.string() }).nullable(),
  }),
  daeun: z.array(z.object({
    startAge: z.number(), endAge: z.number(), startYear: z.number(), ganzhi: z.string(),
  })),
});

export type RichFacts = z.infer<typeof RichFactsSchema>;
```

> `DaeunPeriod` import는 타입 정합 확인용(직접 사용 안 하면 생략 가능). `RichFactsSchema`는 기본 `ReadingFactsSchema`에 pillars·daeun을 더한 것.

- [ ] **Step 2: 실패 테스트 — `reading-prompt.test.ts` 에 append**

```ts
import { buildRichSystemPrompt, buildRichUserPrompt } from "./reading-prompt";
import type { RichFacts } from "./reading-facts";

const richFacts: RichFacts = {
  category: "general", score: 72, hourUnknown: false,
  meOhaeng: { wood: 2, fire: 0, earth: 1, metal: 1, water: 4 },
  pillars: {
    year: { stemHan: "己", stemKo: "기", branchHan: "卯", branchKo: "묘" },
    month: { stemHan: "壬", stemKo: "임", branchHan: "申", branchKo: "신" },
    day: { stemHan: "癸", stemKo: "계", branchHan: "卯", branchKo: "묘" },
    hour: { stemHan: "壬", stemKo: "임", branchHan: "子", branchKo: "자" },
  },
  daeun: [
    { startAge: 8, endAge: 17, startYear: 2006, ganzhi: "癸酉" },
    { startAge: 18, endAge: 27, startYear: 2016, ganzhi: "甲戌" },
  ],
};

describe("buildRichSystemPrompt", () => {
  it("9섹션·톤·용어금지·JSON 규칙을 담는다", () => {
    const s = buildRichSystemPrompt();
    expect(s).toContain("인생 흐름");
    expect(s).toMatch(/용어.*노출|노출.*않|용어.*쓰지/);
    expect(s).toContain("life_flow");
  });
});

describe("buildRichUserPrompt", () => {
  it("기둥·대운·점수를 담는다", () => {
    const u = buildRichUserPrompt(richFacts);
    expect(u).toContain("癸"); // 기둥 한자
    expect(u).toContain("72"); // 점수
    expect(u).toMatch(/대운|8~17|癸酉/); // 대운
  });
});
```

- [ ] **Step 3: 실패 확인** — `npm run test:run -- reading-prompt`

- [ ] **Step 4: 구현 — `reading-prompt.ts` 에 append**

```ts
import type { RichFacts } from "./reading-facts";

export function buildRichSystemPrompt(): string {
  return [
    "당신은 따뜻한 명리학 해석가입니다. 사용자의 사주(천간·지지 8글자)와 대운(시기별 운)을 명리학 규칙으로 해석해 '종합 사주' 풀이를 만듭니다.",
    "",
    "규칙:",
    "1. 말투는 다정한 '오늘의 운세'체('~하네요', '~하길 바랍니다'). 신비주의·겁주기 없음.",
    "2. 명리 용어를 절대 표면에 쓰지 마세요('수생목/비겁/식상/편관/상생상극/도화살/천을귀인/역마' 등 금지, wood/fire 같은 영어 키도 금지). 해석은 내부에서만, 사용자에겐 쉬운 일상어로.",
    "3. 점수(score)는 이미 계산되어 주어집니다. 바꾸지 말고 그 점수와 어울리는 톤으로.",
    "4. '인생 흐름(초년·중년·장년·말년)'은 주어진 대운 흐름에 근거해 쓰세요. 나이를 단정해 틀리지 말고 흐름 위주로.",
    "5. 매력·귀인·조심할 결 등은 '주제'로만 풀고, 특정 신살 이름을 단정하지 마세요.",
    "6. 모든 출력은 한국어.",
    "",
    "출력은 아래 JSON 객체 '하나만'(코드펜스·설명 없이 순수 JSON):",
    "{",
    '  "headline": "4~40자 한 줄 총평",',
    '  "me": "40~320자, 나라는 사람(타고난 성향)",',
    '  "strengths": [{ "title": "2~24자", "detail": "10~220자" }],  // 2~3개',
    '  "cautions": [{ "title": "2~24자", "detail": "10~220자" }],   // 1~2개',
    '  "charm": "30~260자, 내 매력",',
    '  "life_flow": { "early": "초년", "mid": "중년", "late": "장년", "senior": "말년" }, // 각 20~220자',
    '  "love": "30~260자, 사랑·결혼",',
    '  "work_wealth": "30~260자, 일·재물",',
    '  "health": "30~260자, 건강",',
    '  "helpers": "30~260자, 나를 돕는 귀인",',
    '  "now_advice": "30~260자, 요즘 흐름 + 실천 조언"',
    "}",
    "score 필드는 넣지 마세요(외부에서 계산).",
  ].join("\n");
}

export function buildRichUserPrompt(facts: RichFacts): string {
  const KO_OHAENG: Record<string, string> = {
    wood: "목", fire: "화", earth: "토", metal: "금", water: "수",
  };
  const pil = (p: { stemHan: string; stemKo: string; branchHan: string; branchKo: string } | null) =>
    p ? `${p.stemHan}${p.branchHan}(${p.stemKo}${p.branchKo})` : "(시 미상)";
  const ohaeng = (Object.keys(KO_OHAENG) as (keyof typeof facts.meOhaeng)[])
    .map((k) => `${KO_OHAENG[k]} ${facts.meOhaeng[k]}`).join(", ");
  const daeun = facts.daeun.map((d) => `${d.startAge}~${d.endAge}세 ${d.ganzhi}`).join(" / ");
  const lines = [
    `점수: ${facts.score} (고정, 바꾸지 마세요)`,
    `사주 8글자 — 연주 ${pil(facts.pillars.year)}, 월주 ${pil(facts.pillars.month)}, 일주 ${pil(facts.pillars.day)}, 시주 ${pil(facts.pillars.hour)}`,
    `오행 분포: ${ohaeng}`,
    `대운(시기별): ${daeun || "정보 없음"}`,
  ];
  if (facts.hourUnknown) lines.push("참고: 태어난 시각 미상 — 시기·시간 관련은 단정 말고 부드럽게.");
  lines.push("", "위 사주를 바탕으로 9섹션 종합 풀이 JSON을 생성하세요.");
  return lines.join("\n");
}
```

- [ ] **Step 5: 통과 확인** — `npm run test:run -- reading-prompt` (PASS) + `npx tsc --noEmit`

- [ ] **Step 6: 커밋**

```bash
git add src/lib/saju/reading-facts.ts src/lib/saju/reading-prompt.ts src/lib/saju/reading-prompt.test.ts
git commit -m "feat: RichFacts + 9섹션 풍성 프롬프트 빌더"
```

---

### Task 5: reading-ai — generateRichReading (종합)

**Files:**
- Modify: `src/lib/saju/reading-ai.ts`
- Modify: `src/lib/saju/reading-ai.test.ts`

- [ ] **Step 1: 실패 테스트 — `reading-ai.test.ts` 에 append**

```ts
import { generateRichReading } from "./reading-ai";
import type { RichFacts } from "./reading-facts";

const richAiOutput = {
  headline: "타고난 결을 잘 살리는 사람이에요",
  me: "차분하면서도 속에 단단한 심지가 있는 분이에요. 자기 페이스를 지키며 꾸준히 나아갑니다.",
  strengths: [
    { title: "꾸준함", detail: "한번 정한 방향을 오래 밀고 가는 힘이 있어요. 시간이 지날수록 신뢰가 쌓입니다." },
    { title: "균형 감각", detail: "감정과 현실 사이 중심을 잘 잡아요. 흔들려도 금방 제자리를 찾습니다." },
  ],
  cautions: [{ title: "혼자 끌어안기", detail: "다 짊어지려다 지칠 수 있어요. 가끔은 기대도 괜찮습니다." }],
  charm: "은근히 사람을 편하게 만드는 매력이 있어요. 알수록 끌리는 타입입니다.",
  life_flow: {
    early: "초년은 기초를 다지는 시기예요. 다양한 경험이 밑거름이 됩니다.",
    mid: "중년에 흐름이 트여요. 쌓아온 게 결실로 이어집니다.",
    late: "장년엔 안정과 영향력이 함께 와요.",
    senior: "말년은 여유로워요. 결이 따뜻하게 돌아옵니다.",
  },
  love: "마음을 천천히 여는 편이에요. 진득한 인연과 잘 맞습니다.",
  work_wealth: "꾸준히 쌓는 재물운이에요. 한 분야를 깊게 파면 좋습니다.",
  health: "어깨·소화 쪽을 신경 쓰면 좋아요. 규칙적인 리듬이 보약입니다.",
  helpers: "묵묵히 도와주는 연상의 인연이 힘이 돼요.",
  now_advice: "벌이기보다 다지는 때예요. 오늘 한 가지만 또렷이 마무리해보세요.",
};

const richFacts2: RichFacts = {
  category: "general", score: 72, hourUnknown: false,
  meOhaeng: { wood: 2, fire: 0, earth: 1, metal: 1, water: 4 },
  pillars: {
    year: { stemHan: "己", stemKo: "기", branchHan: "卯", branchKo: "묘" },
    month: { stemHan: "壬", stemKo: "임", branchHan: "申", branchKo: "신" },
    day: { stemHan: "癸", stemKo: "계", branchHan: "卯", branchKo: "묘" },
    hour: { stemHan: "壬", stemKo: "임", branchHan: "子", branchKo: "자" },
  },
  daeun: [{ startAge: 8, endAge: 17, startYear: 2006, ganzhi: "癸酉" }],
};

describe("generateRichReading", () => {
  it("9섹션을 반환하고 점수를 계산값으로 덮어쓴다", async () => {
    generateContentMock.mockResolvedValue({ text: JSON.stringify(richAiOutput) });
    const rich = await generateRichReading(richFacts2);
    expect(rich.score).toBe(72);
    expect(rich.life_flow.early.length).toBeGreaterThan(10);
    expect(rich.helpers.length).toBeGreaterThan(10);
  });

  it("JSON 불일치면 throw 한다", async () => {
    generateContentMock.mockResolvedValue({ text: "그냥 텍스트" });
    await expect(generateRichReading(richFacts2)).rejects.toThrow();
  });
});
```

> 기존 `reading-ai.test.ts` 상단의 `generateContentMock`/`vi.mock("@google/genai")`를 그대로 재사용한다(이미 있음).

- [ ] **Step 2: 실패 확인** — `npm run test:run -- reading-ai`

- [ ] **Step 3: 구현 — `reading-ai.ts` 에 추가**

기존 import에 추가:
```ts
import { RichReadingSchema, RichReading } from "../schema";
import { RichFacts } from "./reading-facts";
import { buildRichSystemPrompt, buildRichUserPrompt } from "./reading-prompt";
```

기존 `MODEL` 호출에 temperature를 더하고(generateReading·generateRichReading 공통), 새 함수 추가:
```ts
const AIRichOutputSchema = RichReadingSchema.omit({ score: true });

export async function generateRichReading(facts: RichFacts): Promise<RichReading> {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: buildRichUserPrompt(facts),
    config: {
      systemInstruction: buildRichSystemPrompt(),
      responseMimeType: "application/json",
      temperature: 0.4, // 변동 최소화
    },
  });
  const text = res.text;
  if (!text) throw new Error("Gemini 빈 응답");
  const out = AIRichOutputSchema.parse(JSON.parse(extractJson(text)));
  return { ...out, score: facts.score }; // 점수 고정
}
```

또한 기존 `generateReading`의 `config`에도 `temperature: 0.4` 추가(일관성). `extractJson`은 기존 것 재사용(이미 파일에 있음).

- [ ] **Step 4: 통과 확인** — `npm run test:run -- reading-ai` (PASS) + `npx tsc --noEmit`

- [ ] **Step 5: 커밋**

```bash
git add src/lib/saju/reading-ai.ts src/lib/saju/reading-ai.test.ts
git commit -m "feat: generateRichReading (9섹션) + temperature 0.4"
```

---

### Task 6: 라우트 — 종합이면 Rich

**Files:**
- Modify: `src/app/api/reading/route.ts`

(이 태스크에선 Supabase 없이 종합 Rich 경로만. 저장은 Task 9.)

- [ ] **Step 1: 구현 — `route.ts`**

종합(general)이면 `RichFactsSchema`로 검증 후 `generateRichReading` → `{ rich }` 반환, 실패/키없음 → 종합 더미 `{ rich }`. 그 외 카테고리는 기존 `{ reading, deep }` 그대로.

```ts
import { ReadingFactsSchema, RichFactsSchema } from "@/lib/saju/reading-facts";
import { generateReading, generateRichReading } from "@/lib/saju/reading-ai";
import { generateDummyReading } from "@/lib/saju/reading-dummy";
import { generateDeepBite } from "@/lib/saju/reading-deep";
import { dummyRich } from "@/lib/saju/reading-dummy"; // Step 2에서 추가

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "invalid facts" }, { status: 400 });

  // 종합(general)은 Rich 경로
  if (body.category === "general") {
    let facts;
    try { facts = RichFactsSchema.parse(body); }
    catch { return Response.json({ error: "invalid facts" }, { status: 400 }); }
    if (!process.env.GEMINI_API_KEY) return Response.json({ rich: dummyRich(facts) });
    try {
      return Response.json({ rich: await generateRichReading(facts) });
    } catch (e) {
      console.error("[/api/reading] Rich AI 실패, 더미 폴백:", e);
      return Response.json({ rich: dummyRich(facts) });
    }
  }

  // 그 외 카테고리: 기존 경로
  let facts;
  try { facts = ReadingFactsSchema.parse(body); }
  catch { return Response.json({ error: "invalid facts" }, { status: 400 }); }
  if (!process.env.GEMINI_API_KEY) return Response.json(dummy(facts));
  try { return Response.json(await generateReading(facts)); }
  catch (e) { console.error("[/api/reading] AI 실패, 더미 폴백:", e); return Response.json(dummy(facts)); }
}

function dummy(facts: ReturnType<typeof ReadingFactsSchema.parse>) {
  const reading = generateDummyReading(facts.category, facts.meOhaeng, { relationLine: facts.relationLine });
  reading.score = facts.score;
  if (facts.category === "relationship" && facts.relationOhaengNote) reading.ohaeng_note = facts.relationOhaengNote;
  return { reading, deep: generateDeepBite(facts.category, facts.meOhaeng) };
}
```

- [ ] **Step 2: 종합 더미 추가 — `src/lib/saju/reading-dummy.ts` 에 append**

```ts
import { RichReading } from "../schema";
import { RichFacts } from "./reading-facts";

/** 키 없음/실패 시 종합 화면을 채우는 결정론적 9섹션 더미. */
export function dummyRich(facts: RichFacts): RichReading {
  const dom = dominant(facts.meOhaeng);
  const s = (t: string) => `${t} 지금은 흐름을 차분히 살피기 좋은 때예요. 무리하지 않고 자기 결을 지키면 한결 부드러워집니다.`;
  return {
    score: facts.score,
    headline: "타고난 결을 차분히 살리는 사람이에요",
    me: s("타고난 기운이 한쪽으로 또렷한 편이에요."),
    strengths: [
      { title: STRONG_LABEL[dom], detail: `${KO_LABEL[dom]} 기운이 강해 그 분야에서 자기다움이 잘 드러나요.` },
      { title: "회복 탄력성", detail: "흐름이 막혀도 스스로 균형을 되찾는 편이에요." },
    ],
    cautions: [{ title: "혼자 끌어안기", detail: "다 짊어지려다 지칠 수 있어요. 가끔은 기대도 괜찮습니다." }],
    charm: s("은근히 사람을 편하게 만드는 매력이 있어요."),
    life_flow: {
      early: "초년은 기초를 다지는 시기예요. 다양한 경험이 밑거름이 됩니다.",
      mid: "중년에 흐름이 트여요. 쌓아온 게 결실로 이어집니다.",
      late: "장년엔 안정과 영향력이 함께 와요.",
      senior: "말년은 여유로워요. 그동안의 결이 따뜻하게 돌아옵니다.",
    },
    love: s("마음을 천천히 여는 편이에요."),
    work_wealth: s("꾸준히 쌓는 결의 재물운이에요."),
    health: s("규칙적인 리듬이 보약이에요."),
    helpers: s("묵묵히 곁을 지키는 인연이 힘이 돼요."),
    now_advice: "오늘 한 가지만 정해 작게 마무리해보세요. 방향이 더 중요해요.",
  };
}
```

(`dominant`, `STRONG_LABEL`, `KO_LABEL`은 reading-dummy.ts에 이미 있음. 없으면 export 확인.)

- [ ] **Step 3: 빌드/타입 확인** — `npm run build` + `npx tsc --noEmit` + `npm run test:run`

- [ ] **Step 4: 커밋**

```bash
git add src/app/api/reading/route.ts src/lib/saju/reading-dummy.ts
git commit -m "feat: /api/reading 종합=Rich 경로 + 종합 더미"
```

---

### Task 7: 9섹션 UI + result 페이지

**Files:**
- Create: `src/components/rich-reading.tsx`
- Modify: `src/app/result/[id]/page.tsx`

- [ ] **Step 1: 컴포넌트 — `src/components/rich-reading.tsx`**

```tsx
import { RichReading } from "@/lib/schema";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-bold text-accent">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-fg/90">{children}</div>
    </section>
  );
}

export function RichReadingView({ rich }: { rich: RichReading }) {
  return (
    <div className="space-y-3">
      <Block title="나라는 사람">{rich.me}</Block>
      <Block title="타고난 강점">
        <ul className="space-y-2">
          {rich.strengths.map((s, i) => (
            <li key={i}><b className="text-fg">{s.title}</b> — {s.detail}</li>
          ))}
        </ul>
      </Block>
      <Block title="보완하면 좋은 점">
        <ul className="space-y-2">
          {rich.cautions.map((c, i) => (
            <li key={i}><b className="text-fg">{c.title}</b> — {c.detail}</li>
          ))}
        </ul>
      </Block>
      <Block title="내 매력">{rich.charm}</Block>
      <Block title="인생 흐름">
        <div className="space-y-2">
          <p><b className="text-fg">초년</b> — {rich.life_flow.early}</p>
          <p><b className="text-fg">중년</b> — {rich.life_flow.mid}</p>
          <p><b className="text-fg">장년</b> — {rich.life_flow.late}</p>
          <p><b className="text-fg">말년</b> — {rich.life_flow.senior}</p>
        </div>
      </Block>
      <Block title="사랑·결혼">{rich.love}</Block>
      <Block title="일·재물">{rich.work_wealth}</Block>
      <Block title="건강">{rich.health}</Block>
      <Block title="나를 돕는 귀인">{rich.helpers}</Block>
      <Block title="요즘 흐름 + 조언">{rich.now_advice}</Block>
    </div>
  );
}
```

- [ ] **Step 2: result 페이지 수정 — `src/app/result/[id]/page.tsx`**

종합이면 RichFacts를 만들어 POST하고 `rich`를 렌더. 다른 카테고리는 기존 그대로.

`View` 타입에 추가: `rich?: RichReading;` (종합일 때만).
import 추가:
```tsx
import { RichReadingView } from "@/components/rich-reading";
import { RichReading } from "@/lib/schema";
import { RichFacts } from "@/lib/saju/reading-facts";
import { computeDaeun } from "@/lib/saju/daeun";
```

useEffect 내, facts 만드는 부분을 분기. 종합이면:
```tsx
    if (input.category === "general") {
      const pf = (p: typeof mePillars.year | null) =>
        p ? { stemHan: p.stem.han, stemKo: p.stem.ko, branchHan: p.branch.han, branchKo: p.branch.ko } : null;
      const richFacts: RichFacts = {
        category: "general", score, meOhaeng, hourUnknown,
        pillars: { year: pf(mePillars.year)!, month: pf(mePillars.month)!, day: pf(mePillars.day)!, hour: pf(mePillars.hour) },
        daeun: computeDaeun(input.me),
      };
      const cached = readCache(input);
      if (cached?.rich) { setView({ ...baseView, rich: cached.rich }); return; }
      (async () => {
        try {
          const res = await fetch("/api/reading", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(richFacts) });
          if (!res.ok) throw new Error(String(res.status));
          const data = await res.json() as { rich: RichReading };
          if (cancelled) return;
          writeCache(input, { rich: data.rich } as never);
          setView({ ...baseView, rich: data.rich });
        } catch {
          if (cancelled) return;
          // 폴백: 빈 rich 없이 기존 더미 reading 경로로 — 화면 안 깨지게 reading도 세팅
          const reading = generateDummyReading("general", meOhaeng);
          reading.score = score;
          setView({ ...baseView, reading, deep: generateDeepBite("general", meOhaeng) });
        }
      })();
      return () => { cancelled = true; };
    }
```

> 주의: `readCache`/`writeCache`/`CachedReading` 타입에 `rich?` 를 더해야 한다 — Step 3.
> 렌더부: `view.rich` 있으면 `<RichReadingView rich={view.rich} />`, 없고 `view.reading` 있으면 기존 렌더.

렌더 분기(기존 `<ReadingSections>`/`<DeeperReading>` 자리):
```tsx
      {view.rich ? (
        <RichReadingView rich={view.rich} />
      ) : view.reading ? (
        <>
          <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-fg/90 shadow-sm">{view.reading.ohaeng_note}</p>
          <ReadingSections reading={view.reading} />
          <DeeperReading category={view.category} count={view.meOhaeng} deep={view.deep} />
        </>
      ) : null}
```

`reading`/`deep`/`rich`를 `View`에서 모두 optional로 바꾸고, 헤드라인/점수 표시는 `view.rich?.headline ?? view.reading?.headline`, `view.rich?.score ?? view.reading?.score` 식으로 처리.

- [ ] **Step 3: 캐시 타입에 rich 추가 — `src/lib/reading-cache.ts`**

```ts
export type CachedReading = { reading?: Reading; deep?: DeepReading; rich?: import("@/lib/schema").RichReading };
```

- [ ] **Step 4: 빌드/타입/테스트** — `npx tsc --noEmit` + `npm run build` + `npm run test:run`

- [ ] **Step 5: 수동 확인(키 없이=더미 Rich)** — `npm run dev` → 종합 사주 → 9섹션 더미가 렌더되는지, 다른 카테고리는 기존대로인지.

- [ ] **Step 6: 커밋**

```bash
git add src/components/rich-reading.tsx src/app/result/[id]/page.tsx src/lib/reading-cache.ts
git commit -m "feat: 종합 사주 9섹션 UI + result 페이지 분기"
```

> **여기서 Phase 2 배포 가능** (Supabase 없이 — 매번 생성되지만 풍성+정확).

---

# PHASE 3 — Supabase 영구 저장

### Task 8: Supabase 클라이언트 + 헬퍼

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: 구현 — `src/lib/supabase.ts`**

```ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 키 없으면 null — 라우트가 저장을 건너뛴다(동작은 함).
const client = url && key ? createClient(url, key) : null;

export type StoredPayload = { kind: "rich" | "basic"; data: unknown };

export async function getStoredReading(key: string): Promise<StoredPayload | null> {
  if (!client) return null;
  try {
    const { data, error } = await client.from("saju_readings").select("payload").eq("key", key).maybeSingle();
    if (error || !data) return null;
    return data.payload as StoredPayload;
  } catch {
    return null;
  }
}

export async function storeReading(key: string, category: string, payload: StoredPayload): Promise<void> {
  if (!client) return;
  try {
    await client.from("saju_readings").upsert({ key, category, payload }, { onConflict: "key" });
  } catch {
    /* 저장 실패는 무시(부가기능) */
  }
}
```

- [ ] **Step 2: 타입/빌드 확인** — `npx tsc --noEmit` (supabase-js 설치돼 있어 통과해야 함)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/supabase.ts
git commit -m "feat: Supabase 서버 클라이언트 + 풀이 저장/조회 헬퍼"
```

---

### Task 9: 라우트에 Supabase 조회/저장 연결

**Files:**
- Modify: `src/app/api/reading/route.ts`
- Modify: `src/lib/reading-cache.ts` (readingCacheKey를 서버에서도 쓰게 export 확인 — 이미 export)

클라이언트가 facts에 `cacheKey`(= readingCacheKey(input))를 함께 보내고, 라우트가 그 키로 Supabase 조회/저장한다.

- [ ] **Step 1: 클라이언트가 cacheKey 전송 — `result/[id]/page.tsx`**

richFacts와 일반 facts 둘 다에 `cacheKey: readingCacheKey(input)` 필드를 추가해 POST 본문에 포함. (import `readingCacheKey`.)

- [ ] **Step 2: 스키마에 cacheKey(optional) 허용 — `reading-facts.ts`**

`ReadingFactsSchema`·`RichFactsSchema` 에 `.extend({ cacheKey: z.string().optional() })` 추가(또는 두 스키마 공통 베이스에).

- [ ] **Step 3: 라우트 조회/저장 — `route.ts` 종합 분기 수정**

```ts
import { getStoredReading, storeReading } from "@/lib/supabase";

  if (body.category === "general") {
    let facts;
    try { facts = RichFactsSchema.parse(body); }
    catch { return Response.json({ error: "invalid facts" }, { status: 400 }); }

    // 1) 저장된 결과 우선
    if (facts.cacheKey) {
      const stored = await getStoredReading(facts.cacheKey);
      if (stored?.kind === "rich") return Response.json({ rich: stored.data });
    }
    if (!process.env.GEMINI_API_KEY) return Response.json({ rich: dummyRich(facts) });
    try {
      const rich = await generateRichReading(facts);
      if (facts.cacheKey) await storeReading(facts.cacheKey, "general", { kind: "rich", data: rich });
      return Response.json({ rich });
    } catch (e) {
      console.error("[/api/reading] Rich AI 실패, 더미 폴백:", e);
      return Response.json({ rich: dummyRich(facts) });
    }
  }
```

(일반 카테고리 분기에도 동일 패턴으로 `getStoredReading`/`storeReading`을 `{ kind: "basic", data: { reading, deep } }`로 추가 — 선택. 우선 종합만 해도 됨.)

- [ ] **Step 4: 빌드/타입/테스트** — `npx tsc --noEmit` + `npm run build` + `npm run test:run`

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/reading/route.ts src/lib/saju/reading-facts.ts src/app/result/[id]/page.tsx
git commit -m "feat: 종합 풀이 Supabase 조회/저장 연결"
```

---

### Task 10: env 문서 + DDL

**Files:**
- Modify: `.env.local.example`
- Modify: `README.md`
- Create: `docs/supabase-schema.sql`

- [ ] **Step 1: `.env.local.example` 에 Supabase 추가**

```
# (선택) 풀이 영구 저장용 Supabase. 없으면 저장만 비활성(앱은 동작).
# https://supabase.com → 프로젝트 → Settings → API
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

- [ ] **Step 2: `docs/supabase-schema.sql`**

```sql
-- Supabase SQL Editor 에서 실행.
create table if not exists saju_readings (
  key text primary key,
  category text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
-- 서버(service role)만 접근하므로 RLS는 켜두고 정책 없이 둬도 service key는 우회함.
alter table saju_readings enable row level security;
```

- [ ] **Step 3: README 보강** — "로컬 실행" 블록 아래 한 줄:

```markdown
> (선택) 풀이를 영구 저장하려면 `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`를 `.env.local`/Vercel에 넣고 `docs/supabase-schema.sql`을 Supabase에서 실행하세요. 없으면 저장 없이 동작합니다.
```

- [ ] **Step 4: 전체 확인 + 커밋**

```bash
npm run test:run && npm run build
git add .env.local.example README.md docs/supabase-schema.sql
git commit -m "docs: Supabase 설정 안내 + 테이블 DDL"
```

---

## Self-Review 메모 (작성자 점검 완료)

- **스펙 커버리지:** §3 보정→Task1, §4 대운→Task2, §5 스키마/프롬프트/AI→Task3·4·5, §5 UI→Task7, §6 Supabase→Task8·9·10, §7 UI→Task7, §8 폴백→Task6(더미)·Task7(네트워크), §9 테스트→각 Task. 다른 카테고리 현행 유지 명시.
- **타입 일관성:** `RichReading`(schema.ts)·`RichFacts`(reading-facts.ts)·`DaeunPeriod`(daeun.ts)·`generateRichReading`·`buildRichSystemPrompt/UserPrompt`·`dummyRich`·`RichReadingView`·`getStoredReading/storeReading` 이름이 Task 간 일치. 라우트 반환형 종합=`{rich}`, 그 외=`{reading,deep}`로 일관, result 페이지가 분기.
- **점수 고정 불변식:** generateRichReading·dummyRich·클라이언트 폴백 모두 `score: facts.score`.
- **단계 배포:** Phase1(Task1)·Phase2(2~7)·Phase3(8~10) 각 끝에서 배포 가능.
- **알려진 리스크:** lunar-javascript `getYun`/`next`/`getDaYun` 런타임 동작은 probe로 확인했고 타입은 any라 통과. 실제 Gemini Rich 호출은 키 있어야 검증(키 없으면 더미). 기존 calculate.test.ts가 보정 전 값을 단정하면 Task1 Step5에서 갱신.
