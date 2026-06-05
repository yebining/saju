# 오늘의 한 입 + 한 입 더 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "한 입" 컨셉을 실제 기능으로 — 홈에 매일 바뀌는 **오늘의 한 입**(운세+음식/색깔/사람) 카드, 결과에 **한 입 더**(무료 펼침) + 🍱 사주 한 상(유료 티저)을 **추가만** 한다.

**Architecture:** 외부 키 없이 결정론적으로 구현. 순수 모듈 2개(`daily.ts`, `reading-deep.ts`)가 로직을 담고 TDD로 검증, 클라이언트 컴포넌트 2개가 기존 화면에 한 줄씩 붙는다. 기존 사주 계산(`calculateSaju`)·내 사주 저장(`my-saju.ts`)·오행 헬퍼(`reading-dummy.ts`)를 재사용한다. 모든 표면 텍스트는 다정한 운세 말투 — 명리 용어 노출 금지.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, vitest. (AI·결제·DB 없음)

**참고 spec:** `docs/superpowers/specs/2026-06-05-han-ip-concept-design.md`

---

## 파일 구조

```
src/
├── lib/saju/
│   ├── daily.ts              # [신규] 오늘의 한 입 생성 (순수)
│   ├── daily.test.ts         # [신규]
│   ├── reading-deep.ts       # [신규] 한 입 더 생성 (순수)
│   ├── reading-deep.test.ts  # [신규]
│   └── reading-dummy.ts      # [수정] dominant/weakest/KO_LABEL을 export (재사용용)
├── components/
│   ├── today-bite.tsx        # [신규] 홈 데일리 카드 (클라이언트)
│   └── deeper-reading.tsx    # [신규] 결과 한 입 더 + 한 상 티저
└── app/
    ├── page.tsx              # [추가만] <TodayBite/> 한 줄
    └── result/[id]/page.tsx  # [추가만] <DeeperReading/> 한 줄
```

---

## Task 1: 오늘의 한 입 로직 (`daily.ts`, TDD)

**Files:**
- Create: `src/lib/saju/daily.ts`
- Test: `src/lib/saju/daily.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/saju/daily.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { relate, dailyFortune } from "./daily";

describe("relate", () => {
  it("오행 관계를 5가지로 분류한다", () => {
    expect(relate("wood", "wood")).toBe("same");
    expect(relate("wood", "water")).toBe("supported");  // 수생목: 오늘이 나를 생함
    expect(relate("wood", "fire")).toBe("giving");       // 목생화: 내가 오늘을 생함
    expect(relate("wood", "metal")).toBe("pressured");   // 금극목: 오늘이 나를 극함
    expect(relate("wood", "earth")).toBe("empowered");   // 목극토: 내가 오늘을 극함
  });
});

describe("dailyFortune", () => {
  const base = { myDayOhaeng: "wood", todayDayOhaeng: "water", daySeed: 0 } as const;

  it("관계·색·음식·사람을 채운 결과를 만든다", () => {
    const r = dailyFortune(base);
    expect(r.mood).toContain("챙겨주는");      // supported 무드
    expect(r.color).toBe("남색");              // water 색
    expect(r.food).toBe("미역국");             // water 음식 풀[0]
    expect(r.person).toBe("오래된 친구");      // 사람 풀[0]
    expect(r.nudge.length).toBeGreaterThan(5);
  });

  it("같은 입력에 항상 같은 결과(결정론)", () => {
    expect(dailyFortune(base)).toEqual(dailyFortune(base));
  });

  it("표면 텍스트에 영어 오행 키/명리 용어가 없다", () => {
    const r = dailyFortune({ myDayOhaeng: "fire", todayDayOhaeng: "metal", daySeed: 3 });
    const text = [r.mood, r.nudge, r.food, r.color, r.person].join(" ");
    expect(text).not.toMatch(/wood|fire|earth|metal|water|상생|상극|일간/);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:run -- daily`
Expected: FAIL — `Cannot find module './daily'`

- [ ] **Step 3: 구현**

`src/lib/saju/daily.ts`:
```ts
import { Ohaeng } from "./data";

export type DailyRelation = "same" | "supported" | "giving" | "pressured" | "empowered";
export type DailyBite = { mood: string; nudge: string; food: string; color: string; person: string };

const GENERATES: Record<Ohaeng, Ohaeng> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS: Record<Ohaeng, Ohaeng> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

/** 내 일간 오행과 오늘 일진 오행의 관계 (다섯 갈래, 명리 용어 비노출) */
export function relate(my: Ohaeng, today: Ohaeng): DailyRelation {
  if (my === today) return "same";
  if (GENERATES[today] === my) return "supported"; // 오늘이 나를 생함
  if (GENERATES[my] === today) return "giving";     // 내가 오늘을 생함
  if (CONTROLS[today] === my) return "pressured";   // 오늘이 나를 극함
  return "empowered";                               // 내가 오늘을 극함
}

const MOOD: Record<DailyRelation, { mood: string; nudge: string }> = {
  same: { mood: "오늘은 평소의 당신과 결이 잘 맞는 하루예요. 무리 없이 흐름을 타기 좋겠네요.", nudge: "익숙한 방식대로 차분히 움직여보세요." },
  supported: { mood: "오늘은 주변에서 당신을 챙겨주는 기운이 흘러요. 도움을 청하면 생각보다 쉽게 풀리겠네요.", nudge: "혼자 끙끙대지 말고, 가까운 사람에게 기대보기 좋은 날이에요." },
  giving: { mood: "오늘은 당신의 에너지가 밖으로 잘 뻗는 날이에요. 표현하고 베풀수록 돌아오는 게 많겠네요.", nudge: "미뤄둔 연락이나 표현, 오늘 먼저 건네보기 좋아요." },
  pressured: { mood: "오늘은 살짝 눌리는 듯한 기운이 있어요. 욕심내기보다 한 박자 쉬어가면 좋겠네요.", nudge: "큰 결정은 잠시 미루고, 페이스를 지키는 데 집중해보세요." },
  empowered: { mood: "오늘은 당신이 주도권을 쥐기 좋은 날이에요. 미뤄둔 일을 밀어붙이면 잘 풀리겠네요.", nudge: "망설이던 일, 오늘 한 걸음 먼저 내디뎌보세요." },
};

const COLOR: Record<Ohaeng, string> = { wood: "청록색", fire: "다홍색", earth: "노란색", metal: "흰색", water: "남색" };
const FOOD: Record<Ohaeng, string[]> = {
  wood: ["비빔밥", "나물 한 접시", "쑥떡"],
  fire: ["떡볶이", "마라탕", "토마토 파스타"],
  earth: ["된장찌개", "감자전", "호박죽"],
  metal: ["흰쌀밥", "두부 요리", "배 한 조각"],
  water: ["미역국", "검은콩밥", "시원한 물 한 잔"],
};
const PERSON = ["오래된 친구", "직장 선배", "부모님", "새로운 인연", "가까운 후배", "옛 동료"];

export function dailyFortune(args: { myDayOhaeng: Ohaeng; todayDayOhaeng: Ohaeng; daySeed: number }): DailyBite {
  const rel = relate(args.myDayOhaeng, args.todayDayOhaeng);
  const { mood, nudge } = MOOD[rel];
  const seed = Math.abs(Math.trunc(args.daySeed));
  const foods = FOOD[args.todayDayOhaeng];
  return {
    mood,
    nudge,
    color: COLOR[args.todayDayOhaeng],
    food: foods[seed % foods.length],
    person: PERSON[seed % PERSON.length],
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- daily`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/saju/daily.ts src/lib/saju/daily.test.ts
git commit -m "feat: daily fortune generator (오늘의 한 입) with tests"
```

---

## Task 2: 오늘의 한 입 카드 + 홈 연결

**Files:**
- Create: `src/components/today-bite.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 컴포넌트 구현**

`src/components/today-bite.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { loadMySaju } from "@/lib/my-saju";
import { calculateSaju } from "@/lib/saju/calculate";
import { dailyFortune, DailyBite } from "@/lib/saju/daily";
import { Ohaeng } from "@/lib/saju/data";

export function TodayBite() {
  const [bite, setBite] = useState<DailyBite | null>(null);

  useEffect(() => {
    const me = loadMySaju();
    if (!me) return;
    try {
      const myDay = calculateSaju(me).day;
      const now = new Date();
      const todayDay = calculateSaju({
        year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(),
        hour: 12, minute: 0, isLunar: false, isLeapMonth: false,
      }).day;
      setBite(dailyFortune({
        myDayOhaeng: myDay.stem.ohaeng as Ohaeng,
        todayDayOhaeng: todayDay.stem.ohaeng as Ohaeng,
        daySeed: Math.floor(now.getTime() / 86400000),
      }));
    } catch {
      setBite(null);
    }
  }, []);

  if (!bite) return null;

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-bold text-accent">☀️ 오늘의 한 입</p>
      <p className="mt-2 leading-relaxed text-fg">{bite.mood}</p>

      <div className="mt-4 rounded-xl bg-accent-soft p-3">
        <p className="text-sm font-bold text-accent">🎯 오늘의 작은 한 입</p>
        <p className="mt-1 text-sm text-fg/90">{bite.nudge}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { emoji: "🍙", label: "오늘의 음식", value: bite.food },
          { emoji: "🎨", label: "오늘의 색깔", value: bite.color },
          { emoji: "🫶", label: "오늘의 사람", value: bite.person },
        ].map((it) => (
          <div key={it.label} className="rounded-xl bg-bg p-2">
            <p className="text-base">{it.emoji}</p>
            <p className="mt-1 text-[11px] text-muted">{it.label}</p>
            <p className="text-xs font-bold text-fg">{it.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

> `bg-accent-soft`·`bg-bg`는 `globals.css`의 `@theme` 토큰(`--color-accent-soft`, `--color-bg`)에서 Tailwind v4가 자동 생성하는 유틸리티다.

- [ ] **Step 2: 홈에 추가**

`src/app/page.tsx`의 상단 import에 추가:
```tsx
import { TodayBite } from "@/components/today-bite";
```
그리고 `</header>` 바로 다음, `<MySajuCard />` 바로 위에 한 줄 추가:
```tsx
      </header>

      <TodayBite />

      <MySajuCard />
```

- [ ] **Step 3: 빌드 + 동작 확인**

Run: `npm run build`
Expected: GREEN. 라우트 변동 없음.

수동: `npm run start` 후 — 내 사주 저장 전이면 카드 미노출, 저장하면 홈 상단에 "오늘의 한 입" 카드(운세 + 작은 한 입 + 음식/색깔/사람) 노출. (저장은 기존 MySajuCard로)

- [ ] **Step 4: 커밋**

```bash
git add src/components/today-bite.tsx src/app/page.tsx
git commit -m "feat: 오늘의 한 입 card on home"
```

---

## Task 3: 한 입 더 로직 (`reading-deep.ts`, TDD)

오행 헬퍼를 `reading-dummy.ts`에서 재사용하기 위해 export로 노출한 뒤, 깊은 풀이 생성기를 만든다.

**Files:**
- Modify: `src/lib/saju/reading-dummy.ts` (export 추가)
- Create: `src/lib/saju/reading-deep.ts`
- Test: `src/lib/saju/reading-deep.test.ts`

- [ ] **Step 1: reading-dummy.ts에서 헬퍼 export**

`src/lib/saju/reading-dummy.ts`에서 아래 세 선언에 `export`를 붙인다 (동작 변경 없음, 기존 테스트 그대로 통과):
- `const KO_LABEL` → `export const KO_LABEL`
- `function dominant(` → `export function dominant(`
- `function weakest(` → `export function weakest(`

- [ ] **Step 2: 실패 테스트 작성**

`src/lib/saju/reading-deep.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateDeepBite } from "./reading-deep";

const count = { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 };

describe("generateDeepBite", () => {
  it("3개 섹션을 만든다", () => {
    const r = generateDeepBite("love", count);
    expect(r.sections).toHaveLength(3);
    r.sections.forEach((s) => {
      expect(s.title.length).toBeGreaterThan(2);
      expect(s.body.length).toBeGreaterThan(30);
    });
  });

  it("같은 입력에 항상 같은 결과(결정론)", () => {
    expect(generateDeepBite("wealth", count)).toEqual(generateDeepBite("wealth", count));
  });

  it("표면 텍스트에 영어 오행 키/명리 용어가 없다", () => {
    const text = generateDeepBite("general", count).sections.map((s) => s.title + s.body).join(" ");
    expect(text).not.toMatch(/wood|fire|earth|metal|water|상생|상극|일간/);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm run test:run -- reading-deep`
Expected: FAIL — `Cannot find module './reading-deep'`

- [ ] **Step 4: 구현**

`src/lib/saju/reading-deep.ts`:
```ts
import { OhaengCount } from "./data";
import { Category } from "../categories";
import { dominant, weakest, KO_LABEL } from "./reading-dummy";

export type DeepReading = { sections: { title: string; body: string }[] };

const FLOW: Record<Category, string> = {
  general: "전반적으로 기운이 한쪽으로 흐르는 시기예요.",
  love: "관계에서 마음이 먼저 움직이는 시기예요.",
  wealth: "돈과 기회를 보는 눈이 예민해지는 시기예요.",
  health: "몸이 보내는 신호에 더 솔직해지는 시기예요.",
  relationship: "두 사람 사이의 결이 또렷해지는 시기예요.",
};

export function generateDeepBite(category: Category, count: OhaengCount): DeepReading {
  const dom = KO_LABEL[dominant(count)];
  const weak = KO_LABEL[weakest(count)];
  return {
    sections: [
      {
        title: "요즘 당신의 흐름",
        body: `${FLOW[category]} 특히 ${dom} 기운이 두드러져, 그 방향의 일에서 자기다움이 잘 드러나요. 욕심을 조금만 덜면 흐름이 한결 부드러워집니다.`,
      },
      {
        title: "이런 결정이 잘 맞아요",
        body: `${dom} 기운을 살리는 선택이 잘 맞아요. 새로 벌이기보다 하던 것을 또렷하게 마무리하는 쪽으로, 익숙하고 잘하는 영역에서 한 걸음 더 나아가 보세요.`,
      },
      {
        title: "이 타이밍은 한 박자 쉬어가기",
        body: `${weak} 기운이 약해, 세심함과 마무리가 필요한 일에서는 서두르면 아쉬움이 남을 수 있어요. 급한 결정은 하루만 더 묵혀두면 후회가 줄어듭니다.`,
      },
    ],
  };
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm run test:run`
Expected: PASS (기존 18개 + reading-deep 신규 모두 통과)

- [ ] **Step 6: 커밋**

```bash
git add src/lib/saju/reading-dummy.ts src/lib/saju/reading-deep.ts src/lib/saju/reading-deep.test.ts
git commit -m "feat: deep reading generator (한 입 더) with tests"
```

---

## Task 4: 한 입 더 섹션 + 한 상 티저 + 결과 연결

**Files:**
- Create: `src/components/deeper-reading.tsx`
- Modify: `src/app/result/[id]/page.tsx`

- [ ] **Step 1: 컴포넌트 구현**

`src/components/deeper-reading.tsx`:
```tsx
import { Category } from "@/lib/categories";
import { OhaengCount } from "@/lib/saju/data";
import { generateDeepBite } from "@/lib/saju/reading-deep";

export function DeeperReading({ category, count }: { category: Category; count: OhaengCount }) {
  const deep = generateDeepBite(category, count);
  return (
    <div className="space-y-3">
      <details className="rounded-2xl border border-border bg-card shadow-sm">
        <summary className="cursor-pointer list-none p-4 text-base font-bold text-accent">
          🥢 한 입 더 <span className="text-xs font-normal text-muted">— 무료로 더 깊은 풀이 보기</span>
        </summary>
        <div className="space-y-4 px-4 pb-4">
          {deep.sections.map((s, i) => (
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

- [ ] **Step 2: 결과 페이지에 추가**

`src/app/result/[id]/page.tsx`의 상단 import에 추가:
```tsx
import { DeeperReading } from "@/components/deeper-reading";
```
그리고 `<ReadingSections reading={view.reading} />` 다음, 접이식 만세(`<details>...ManseTable...`) **앞**에 한 줄 추가:
```tsx
      <ReadingSections reading={view.reading} />

      <DeeperReading category={view.category} count={view.meOhaeng} />
```

- [ ] **Step 3: 빌드 + 동작 확인**

Run: `npm run build`
Expected: GREEN.

수동: 결과 페이지에서 강점/주의점 아래에 `🥢 한 입 더`(펼치면 3섹션) + `🍱 사주 한 상 (준비 중)` 티저가 보임.

- [ ] **Step 4: 커밋**

```bash
git add src/components/deeper-reading.tsx "src/app/result/[id]/page.tsx"
git commit -m "feat: 한 입 더 deeper reading + 사주 한 상 teaser on result"
```

---

## Task 5: 최종 검증 + 배포

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm run test:run && npm run build`
Expected: 모든 테스트 PASS(기존 18 + daily + reading-deep), 빌드 GREEN.

- [ ] **Step 2: 프로덕션 스모크**

`npm run start` 후 (포트 3000 점유 시 정리):
- 내 사주 저장 → 홈 상단 "오늘의 한 입" 카드 노출, 음식/색깔/사람 채워짐.
- 카테고리 결과 → "한 입 더" 펼침 3섹션 + "사주 한 상" 티저.
- 명리 용어("수생목" 등) 미노출 확인.

- [ ] **Step 3: main 머지 + 배포**

```bash
git checkout main
git merge --no-ff feat/han-ip -m "feat: 오늘의 한 입 + 한 입 더"
git push origin main
```
Expected: Vercel 자동 재배포. 라이브에서 전체 흐름 확인.

---

## v2로 미루는 것

🍱 사주 한 상의 실제 결제·잠금·딥풀이(AI), 데일리 알림/출석, "오늘의 ~~" 항목 확장, 기본 결과 깊이 강화.
