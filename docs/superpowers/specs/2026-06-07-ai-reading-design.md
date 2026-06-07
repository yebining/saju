# AI 풀이 — 기본 결과 + 한 입 더를 Claude로 생성 (설계)

> 2026-06-07 · 지금까지 결정론적 더미였던 풀이를 **실제 Claude(Sonnet 4.6) 명리학 해석**으로 교체한다. `2026-06-05-han-ip-concept-design.md`에서 "Phase 2 AI에서 생성"으로 미뤄둔 작업의 본편.

## 1. 배경 & 방향

현재 모든 풀이(`generateDummyReading`, `generateDeepBite`)는 오행 분포로 분기하는 **고정 로직**이고, 결과 페이지는 100% 클라이언트에서 동기 실행된다. 서버도 API 키도 없다. `generateDummyReading` 주석에는 이미 *"Phase 2 LLM 폴백 겸용"*이라 적혀 있고 zod `ReadingSchema`도 존재 — **AI가 들어올 자리가 비워진 설계**다.

이번 작업은 **기본 풀이 + 한 입 더**를 AI로 교체한다. (오늘의 한 입 `daily.ts`는 결정론 유지 — 이번 범위 밖.)

### 핵심 원칙

- **계산과 풀이를 구분한다.** 천간·지지 네 기둥, 오행 분포, 점수는 **계산으로 고정**(만세력 변환은 수학이지 해석이 아님). AI는 그 위에 **풀이 문장만** 얹는다.
- **명리학 근거.** AI는 실제 계산된 기둥·오행을 "재료"로 받아 명리 규칙으로 해석한다. 허공에서 짓지 않는다.
- **명리 용어 표면 비노출.** "수생목" 같은 용어는 출력에 절대 안 나온다(CONCEPT.md 약속). 명리 추론은 내부에서만, 사용자에겐 다정한 쉬운 한국어만.
- **갈아끼우기 쉽게.** 모든 Claude 호출은 `reading-ai.ts` 한 파일에 격리. 모델 교체 = 이 파일 한 줄.
- **절대 안 깨짐.** 키 없음·호출 실패 시 기존 더미로 폴백.

## 2. 아키텍처 — 데이터 흐름

```
브라우저 (result/[id]/page.tsx)
  │ ① 생일 → calculateSaju / countOhaeng / scoreFromOhaeng  (지금처럼 클라이언트)
  │ ② 캐시 확인: sessionStorage["reading:" + inputHash]
  │     └ hit → 즉시 렌더, 종료
  │ ③ miss → POST /api/reading  { category, score, meOhaeng, themOhaeng?, relationLine?, hourUnknown }
  ▼
서버 라우트 (app/api/reading/route.ts) — ANTHROPIC_API_KEY 보관
  │ ④ 입력 zod 검증 → generateReading(facts) 호출  (reading-ai.ts)
  │     └ Claude(Sonnet 4.6) · 명리학 시스템 프롬프트 · structured output(ReadingSchema)
  │ ⑤ 호출 실패/키 없음 → generateDummyReading(facts) 폴백
  │ ⑥ { reading, deep } JSON 반환 (기본 풀이 + 한 입 더를 한 번에)
  ▼
브라우저: 풀이·한 입 더 렌더 + sessionStorage에 캐시
```

서버는 Next.js Route Handler 하나로 끝. Vercel에 그대로 배포되고 새 인프라(DB/KV)는 없다.

## 3. 컴포넌트 (각각 한 가지 일만)

### `src/lib/saju/reading-ai.ts` [신규] — Claude 호출 격리
- `export async function generateReading(facts: ReadingFacts): Promise<Reading>`
- `ReadingFacts` = `{ category, score, meOhaeng, themOhaeng?, relationLine?, hourUnknown }` (사주 사실 데이터).
- 내부: `@anthropic-ai/sdk` → `client.messages.parse({ model, system, messages, output_config: { format: zodOutputFormat(ReadingSchema) } })`.
- **모델·프롬프트가 사는 유일한 파일.** `MODEL = "claude-sonnet-4-6"` 상수 한 줄.
- 점수는 프롬프트에 "이 점수에 맞춰 톤을 잡되 숫자는 바꾸지 말 것"으로 전달하고, 반환 시 **계산된 score로 덮어쓴다**(AI가 흔들어도 무시).
- 관계 궁합이면 `relation_line`을 계산값으로 세팅(현행 로직 유지), `ohaeng_note`도 `describeRelation` 결과를 우선.

### `src/lib/saju/reading-prompt.ts` [신규] — 프롬프트 빌더 (순수, 테스트 대상)
- `buildSystemPrompt()` · `buildUserPrompt(facts)` 를 순수 함수로 분리 → 단위 테스트 가능.
- 시스템 프롬프트: 명리학 해석가 역할 + 톤 규칙(다정/쉬움) + **명리 용어 출력 금지** + 카테고리별 초점 + "점수 숫자 변경 금지".
- 유저 프롬프트: 계산된 기둥·오행·점수·(관계면 상대 정보)를 구조화해 전달.

### `src/app/api/reading/route.ts` [신규] — 서버 핸들러
- `POST` 만. body zod 검증(`ReadingFactsSchema`).
- `try { return generateReading(facts) } catch { return generateDummyReading(...) }`.
- `ANTHROPIC_API_KEY` 미설정이면 곧장 더미(불필요한 호출 안 함).
- 런타임은 Node(기본). 응답은 검증된 `Reading` JSON.

### `src/lib/saju/reading-deep.ts` [수정] — 한 입 더도 AI화
- 기존 `generateDeepBite` (동기 더미)는 **폴백으로 유지**.
- 신규 `generateDeepReadingAI(facts): Promise<DeepReading>` 추가, 같은 라우트에서 기본 풀이와 **한 번의 호출로 함께 생성**(왕복·비용 절감) — `ReadingSchema`에 `deep_sections` 옵션 필드를 더하거나, 라우트가 `{ reading, deep }`를 같이 반환.
  - 결정: **기본 풀이 + 한 입 더를 한 호출로** 생성해 한 번에 캐시. (별도 호출 대비 비용·지연 절반)

### `src/app/result/[id]/page.tsx` [수정] — 동기 → 비동기 + 캐시 + 로딩
- 기존 `const reading = generateDummyReading(...)` (동기) → `fetch("/api/reading", …)` 로딩 상태.
- 캐시: `sessionStorage["reading:" + hash(input)]` 우선 조회/저장.
- 로딩 중: 기존 "풀이 불러오는 중…" 결의 **"풀이 우려내는 중…"**.
- 계산(기둥·오행·점수)은 지금처럼 클라이언트에서, AI 문장만 받아 끼운다.

### `src/lib/saju/reading-dummy.ts` [변경 없음] — 폴백 전용으로 유지

## 4. 스키마 & 구조화 출력

기존 `ReadingSchema`(zod)를 그대로 `zodOutputFormat`에 사용한다. SDK가 미지원 제약(string `min/max`, number `min/max`)은 API 스키마에서 빼고 **클라이언트단에서 검증**하므로 안전.

한 입 더 섹션을 같은 호출로 받기 위해 출력용 확장 스키마:

```ts
// reading-ai 전용 출력 스키마 (기존 ReadingSchema + deep)
const AIReadingSchema = ReadingSchema.extend({
  deep_sections: z.array(z.object({
    title: z.string().min(2).max(24),
    body: z.string().min(20).max(400),
  })).min(2).max(3),
});
```

라우트 반환: `{ reading: Reading, deep: DeepReading }`. `score`/`relation_line`/관계 `ohaeng_note`는 서버에서 **계산값으로 덮어써** 일관성 보장.

## 5. 톤 & 명리 규칙 (프롬프트에 박는다)

- 말투: 다정한 "오늘의 운세" ("~하네요", "~하길 바랍니다").
- **금지:** "수생목/비겁/식상/편관" 등 명리 용어, 영어 오행 키(wood/fire…), "생/극" 직접 노출.
- 카테고리별 초점: 종합=기운 균형, 연애=관계 흐름, 재물=돈·기회, 건강=컨디션, 궁합=두 사람의 결.
- 분량: `ReadingSchema` 길이 제약(헤드라인 4~40자, detail 10~220자 등) 안에서.

## 6. 환경 변수 & 배포

- `ANTHROPIC_API_KEY` — 로컬 `.env.local`, Vercel 프로젝트 환경변수. **클라이언트 절대 노출 금지**(서버 라우트 전용, `NEXT_PUBLIC_` 아님).
- `@anthropic-ai/sdk` 의존성 추가.
- 키가 없는 환경(예: 미설정 프리뷰)에서도 더미 폴백으로 정상 동작.

## 7. 에러 처리 & 폴백

| 상황 | 동작 |
|---|---|
| 키 미설정 | 라우트가 즉시 더미 반환(호출 안 함) |
| Claude 호출 실패/타임아웃/검증 실패 | catch → 더미 반환 |
| 라우트 자체 4xx/5xx | 클라이언트가 더미로 폴백 렌더 |
| 부분 응답(max_tokens) | 검증 실패로 처리 → 더미 |

사용자에겐 항상 정상 풀이로 보인다(폴백 안내문 없음). 면책 문구("AI가 명리학 기본 규칙으로 풀이…")는 현행 유지.

## 8. 테스트

- `reading-prompt.test.ts` [신규]: `buildUserPrompt(facts)`가 기둥·오행·점수를 포함하고, `buildSystemPrompt()`에 톤·금지어 규칙이 들어감. (순수 함수, 외부 호출 없음)
- `reading-ai.test.ts` [신규]: Anthropic SDK를 **모킹**해 `generateReading`이 (a) 반환 score를 계산값으로 덮어쓰는지, (b) 검증 실패 시 throw하는지, (c) 관계 카테고리에서 relation_line/ohaeng_note를 계산값으로 세팅하는지.
- 라우트 테스트(선택): 키 미설정 시 더미 폴백 경로.
- 기존 테스트 전부 회귀 유지(`reading-dummy`, 계산, daily 등).
- 수동 QA: 키 설정 후 각 카테고리 풀이 생성/캐시 재사용/한 입 더 노출, 키 제거 후 더미 폴백 확인.

## 9. 이후로 미루는 것 (이번 범위 밖)

- **오늘의 한 입 AI화** — 결정론 유지(매일 호출은 비용·캐시 복잡).
- **서버 캐시(Vercel KV)** — 사용자 간 공유 캐시. 지금은 브라우저 캐시로 충분.
- **스트리밍 타이핑 UX** — 추후 폴리시.
- **사주 한 상(유료 심층)** — 별도 기획·결제 과제.
- **점수도 AI가 판단** — 캐시로 가능하지만 일관성 위해 계산 고정 유지(원하면 추후 reading-ai에서 전환).
