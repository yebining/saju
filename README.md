# 사주 한 입

복잡한 사주를, 한 입씩 가볍게. 생일만 알려주면 AI가 종합·연애·재물·건강운과 궁합까지 따뜻하게 풀어주는 사주 서비스.

🔗 라이브: https://saju-tawny-gamma.vercel.app

## 컨셉 & 브랜드

서비스 컨셉·톤·브랜드 정본은 **[concept/CONCEPT.md](./concept/CONCEPT.md)** 참고.

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run test:run # 단위 테스트
npm run build    # 프로덕션 빌드
```

> AI 풀이를 쓰려면 `GEMINI_API_KEY`를 `.env.local`에 넣으세요(`.env.local.example` 참고, [발급](https://aistudio.google.com/apikey)). 키가 없으면 결정론적 더미 풀이로 동작합니다.
>
> (선택) 풀이를 영구 저장(같은 사람=항상 같은 결과)하려면 `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`를 `.env.local`/Vercel에 넣고 `docs/supabase-schema.sql`을 Supabase에서 실행하세요. 없으면 저장 없이 동작합니다.

## 구조

- `src/app` — 라우트 (`/`, `/check/[category]`, `/result/[id]`)
- `src/components` — UI 컴포넌트
- `src/lib/saju` — 사주 계산·풀이 로직 (순수 함수, 테스트 포함)
- `src/lib/categories.ts` — 카테고리 단일 소스
- `docs/superpowers/` — 설계(spec)·구현(plan) 문서

기술 스택: Next.js 16(App Router) · TypeScript · Tailwind v4 · lunar-javascript · zod · vitest.
