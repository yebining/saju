# 종합 사주 v2 — 정확한 계산 + 풍성한 9섹션 풀이 + 영구 저장 (설계)

> 2026-06-07 · 현재 종합 풀이가 (a) 너무 얕고 (b) 오행이 표준과 안 맞고 (c) 새로고침마다 바뀌는 문제를 한 번에 잡는다. 진태양시 보정으로 계산을 표준화하고, 실제 기둥·대운을 AI에 넘겨 9섹션 풍성한 풀이를 만들고, Supabase에 저장해 "같은 사람=항상 같은 결과"로 고정한다.

선행: `2026-06-07-ai-reading-design.md`(Claude→Gemini 교체 완료, gemini-2.5-flash).

## 1. 배경 — 세 가지 문제

1. **풀이가 얕음** — 출력 스키마가 `강점2·주의1·조언`만 담고, AI에 **오행 분포+점수만** 줘서 두루뭉술. 시기별(초년·중년·말년)·결혼·자녀·건강·매력·귀인 같은 결이 없다.
2. **오행이 표준과 안 맞음** — **진태양시(경도) 보정 누락**. 실측 확인:
   | | 시주 | 오행 |
   |---|---|---|
   | 현재(01:02 그대로) | 癸丑 | 목2 화0 **토2** 금1 **수3** |
   | 보정(-32분→00:30) | 壬子 | 목2 화0 **토1** 금1 **수4**(표준) |
   - 1999-08-19 01:02(양력) 입력은 시 경계(01:00) 직후라, 경도 보정 시 子시(수)로 넘어간다. 한국 사주 사이트는 모두 이 보정을 한다.
3. **결과가 매번 바뀜** — 캐시가 sessionStorage(탭 단위)뿐이고, AI가 호출마다 다른 문장 생성.

## 2. 핵심 원칙 (유지)

- **계산은 코드(사실), 풀이는 AI(의미).** 점수·오행·기둥·대운은 결정론적 계산, AI는 그 위에 따뜻한 풀이만.
- **명리 용어 표면 비노출.** 신살(귀인/도화/살)은 AI가 **주제로만** 풀고 특정 이름을 단정하지 않는다(환각 방지).
- **갈아끼우기 쉽게 / 폴백.** AI 호출은 `reading-ai.ts` 한 파일. 키 없음·실패 시 더미.

## 3. 계산 정확도 — 진태양시 보정

### `src/lib/saju/calculate.ts` [수정]
- `calculateSaju` 가 기둥 계산 전 **입력 시각을 경도 기준으로 보정**한다.
- 보정량(분) = `(135 - longitude) * 4`. 기본 longitude = **서울 126.978°E ≈ -32.1분**.
  - 보정은 **분 단위로 빼서** 새 시각을 만들고(날짜 넘어가면 자연히 처리), 그 시각으로 `Solar.fromYmdHms` → EightChar.
- **시 미상(hour=null)**: 보정해도 정오 기준이라 영향 없음 — 기존처럼 12:00 사용, 보정 생략 가능(연·월·일 기둥은 시각 무관). 시가 있을 때만 보정 적용.
- longitude는 당장은 **상수(서울)**. 도시 선택 UI는 후속(§9).
- 검증: 위 1999-08-19 01:02 입력 → 시주 壬子, 오행 목2화0토1금1수4 가 나와야 한다(테스트).

> 참고: 자시(子) 날짜 경계(야자시) 등 더 세밀한 규약은 lunar-javascript 기본 동작을 따르고 이번 범위 밖. 경도 보정만으로 대다수 케이스가 표준과 일치.

### 오행 막대(`countOhaeng`) [변경 없음]
- 보정된 기둥으로 세므로 자동으로 표준과 맞는다. 지장간 미포함(겉 8글자) 유지 — 사용자 비교 기준도 8글자 합(=8)이었음.

## 4. 대운(시기별) 계산

### `src/lib/saju/daeun.ts` [신규]
- `computeDaeun(input): DaeunPeriod[]` — lunar-javascript `EightChar.getYun(gender).getDaYun()` 사용.
  - gender 매핑: male→1, female→0 (lunar-javascript 규약, 구현 시 확인).
  - 각 항목 `{ startAge, endAge, startYear, ganzhi }`. 첫 항목(입운 전, 간지 빈 값)은 제외/구분.
- 출력 예(1999-08-19 여): `8~17 癸酉, 18~27 甲戌, 28~37 乙亥, 38~47 丙子 …`
- 순수 함수, 테스트 포함(개수·나이 단조 증가·간지 비어있지 않음).

## 5. 풍성한 9섹션 풀이

### 출력 스키마 — `src/lib/schema.ts` 에 `RichReadingSchema`(신규) 정의
9개 섹션을 담는 구조. 각 섹션은 제목 고정 + AI 본문. 기존 `ReadingSchema`와 같은 파일에 나란히 둔다.

| 키 | 섹션 | 본문 길이(가이드) |
|---|---|---|
| `me` | 나라는 사람 | 60~300자 |
| `strengths` | 강점 (2~3) / `cautions` 보완점(1~2) | 각 10~220자 |
| `charm` | 내 매력 | 40~250자 |
| `life_flow` | 인생 흐름 (초년·중년·장년·말년 4파트) | 각 40~200자 |
| `love` | 사랑·결혼 | 40~250자 |
| `work_wealth` | 일·재물 | 40~250자 |
| `health` | 건강 | 40~250자 |
| `helpers` | 나를 돕는 귀인 | 40~250자 |
| `now_advice` | 요즘 흐름 + 조언 | 40~250자 |

- `headline`(한 줄 총평)·`score`(계산 고정)는 상단 유지.
- `life_flow`는 `{ early, mid, late, senior }` 4개 문단(대운을 근거로).
- 새 zod 스키마 `RichReadingSchema`. 기존 `ReadingSchema`(기본 결과)는 **다른 카테고리(연애·재물·건강·궁합)가 계속 쓰므로 유지**. 종합만 Rich로.

### AI 입력(프롬프트) — `src/lib/saju/reading-prompt.ts` [확장]
- 종합(general)일 때 **풍성 프롬프트**: 8글자 전체(천간·지지 한자+한글), 오행 분포, 점수, **대운 목록(나이대별 간지)**, 시 미상 여부를 재료로 제공.
- 규칙(기존 + 추가): 9섹션 각각을 쓰되 **명리 용어·신살 이름 금지**, 시기별은 대운 흐름에 근거, score 변경 금지.
- 다른 카테고리는 기존 프롬프트/스키마 유지.

### AI 호출 — `src/lib/saju/reading-ai.ts` [수정]
- 종합이면 `RichReadingSchema`로 9섹션 생성, 그 외는 기존 동작.
- `responseMimeType: "application/json"` + 프롬프트 형태 강제 + zod 검증(기존 패턴). **temperature 낮춤(예: 0.4)** 으로 변동 최소화.
- score·(관계)relation 필드 계산값으로 덮어쓰기 유지.

## 6. 결과 저장 — Supabase (서버)

### 흐름 (`src/app/api/reading/route.ts` [수정])
```
POST /api/reading { facts(+inputKey) }
  → Supabase 에서 (inputKey, category) 조회
      └ 있으면 저장된 { reading, deep|sections } 반환 (재호출 없음)
  → 없으면 generateReading(facts) → Supabase upsert → 반환
  → 키/DB 없음·실패 → 더미 폴백(현행)
```

### `src/lib/supabase.ts` [신규]
- 서버 전용 클라이언트. `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`(서버 전용 env). `NEXT_PUBLIC_` 아님.
- 테이블 `saju_readings`: `key text primary key`(= inputKey+category 해시), `category text`, `payload jsonb`(reading+sections), `created_at timestamptz default now()`.
- 헬퍼: `getStoredReading(key)`, `storeReading(key, category, payload)`. 실패는 throw 말고 null/no-op(폴백이 받게).

### inputKey
- 기존 `readingCacheKey`(생일+카테고리 정규화)를 재사용해 서버 키로도 씀. 클라이언트가 facts와 함께 전송하거나, 서버가 facts에서 재계산.

### 키/DB 미설정 시
- env 없으면 Supabase 조회/저장 건너뛰고 매번 생성(또는 더미). 즉 **Supabase 없이도 동작**(저장만 안 됨). 키 넣으면 영구 고정 활성화.

## 7. UI — 9섹션 렌더

### `src/components/rich-reading.tsx` [신규]
- props: `{ rich: RichReading }`. 9섹션을 카드/소제목으로 렌더(코지 톤, 기존 디자인 토큰 사용).
- `life_flow`는 초년·중년·장년·말년 타임라인 형태.
### `src/app/result/[id]/page.tsx` [수정]
- 종합이면 `RichReading` fetch 후 `<RichReading>` 렌더. 점수 게이지·오행 막대·만세력은 위에 유지.
- 다른 카테고리는 기존 `ReadingSections`/`DeeperReading` 유지.
- 캐시: Supabase가 주 저장소. 클라이언트 sessionStorage는 즉시표시용 보조(선택).

## 8. 에러 처리 & 폴백

- 진태양시 보정 실패/이상값 → 보정 없이 진행(방어적). 
- 대운 계산 throw → 시기별 없이 나머지 8섹션 생성하거나 더미.
- AI 실패/JSON 불일치 → 종합 더미(기존 `generateDummyReading`를 9섹션 형태로 감싼 더미 or 기본 더미). 화면 안 깨짐.
- Supabase 실패 → 저장만 건너뜀, 생성 결과 그대로 반환.

## 9. 테스트

- `calculate.test.ts`: 1999-08-19 01:02(양력, 여) → 시주 壬子, 오행 목2화0토1금1수4 (보정 검증). 시 미상은 보정 영향 없음.
- `daeun.test.ts`: 대운 배열 개수·나이 단조·간지 존재.
- `reading-prompt`/`reading-ai`(종합): 9섹션 프롬프트에 8글자·대운 포함, RichReadingSchema 파싱·score 덮어쓰기·SDK 모킹.
- 라우트: Supabase 모킹 — 히트 시 재호출 없음, 미스 시 생성+저장, 키 없으면 폴백.
- 기존 테스트 회귀 유지.

## 10. 이후로 미루는 것 / 셋업 필요

- **Supabase 프로젝트 + 키 발급**(SUPABASE_URL·SERVICE_ROLE_KEY) — 코드는 미리, 키는 사용자가 나중에 Vercel env 등록. 없으면 저장만 비활성(동작은 함).
- **출생 도시 선택**(경도 보정 정밀화) — 지금은 서울 상수.
- **신살 정밀 계산**(귀인/도화/살 실제 lookup) — 지금은 AI 주제로만.
- 자녀·가정 섹션, 연애·재물·건강 카테고리의 Rich화 — 후속.
- 사주 한 상(유료 심층)·결제.
