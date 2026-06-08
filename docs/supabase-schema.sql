-- 사주 풀이 영구 저장 테이블.
-- Supabase 프로젝트 → SQL Editor 에 붙여넣고 실행하세요.
-- (앱은 이 테이블 없이도 동작하며, 있으면 같은 생일+카테고리 풀이를 1회 생성 후 영구 재사용합니다.)

create table if not exists saju_readings (
  key text primary key,            -- readingCacheKey(생일+카테고리 정규화)
  category text not null,
  payload jsonb not null,          -- { kind: "rich"|"basic", data: ... }
  created_at timestamptz not null default now()
);

-- 서버(service role 키)에서만 접근하므로 RLS를 켜두고 정책은 두지 않는다.
-- service role 키는 RLS를 우회하므로 서버 라우트는 정상 동작하고,
-- 익명/클라이언트 접근은 차단된다.
alter table saju_readings enable row level security;
