import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/categories";
import { BowlIcon } from "@/components/bowl-icon";
import { BrandLogo } from "@/components/brand-logo";
import { TodayBite } from "@/components/today-bite";
import { MySajuCard } from "@/components/my-saju-card";

// 카테고리별 레트로 포인트색 (점/뱃지)
const DOT: Record<Category, string> = {
  general: "var(--color-accent2)",
  love: "var(--color-accent)",
  wealth: "var(--color-gold)",
  health: "var(--color-accent2)",
  relationship: "var(--color-mystic)",
};

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-12">
      {/* 간판 뱃지 */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-card px-3.5 py-1 text-[11px] font-bold tracking-wide text-ink shadow-retro">
          🔮 AI 사주 · 무료 · 무가입
        </span>
      </div>

      {/* 브랜드 + 히어로 */}
      <header className="mt-7 text-center">
        <BrandLogo />
        <h1 className="mt-7 text-[2.7rem] leading-[1.05] text-ink">
          오늘은
          <br />
          <span className="relative inline-block">
            <span className="absolute inset-x-[-6px] bottom-1 top-2 -z-0 -rotate-1 bg-gold/60" aria-hidden />
            <span className="relative z-10">뭐가 궁금해요?</span>
          </span>
        </h1>
        <p className="mt-5 text-sm font-medium leading-relaxed text-muted">
          생일만 알려주면 AI가 당신의 사주를
          <br />
          따뜻하게 풀어드려요.
        </p>
      </header>

      <div className="mt-9">
        <TodayBite />
        <MySajuCard />
      </div>

      {/* 카테고리 메뉴 */}
      <div className="mt-2 mb-3 flex items-center gap-2">
        <span className="h-[2px] flex-1 bg-ink/15" />
        <span className="font-display text-sm text-ink/70">무엇을 볼까요</span>
        <span className="h-[2px] flex-1 bg-ink/15" />
      </div>

      <nav className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/check/${c.key}`}
            className={`group relative rounded-2xl border-2 border-ink bg-card p-4 shadow-retro transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-retro-lg active:translate-x-0 active:translate-y-0 active:shadow-none ${
              c.persons === 2 ? "col-span-2 flex items-center gap-3" : ""
            }`}
          >
            <span
              className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border border-ink/30"
              style={{ background: DOT[c.key] }}
              aria-hidden
            />
            <BowlIcon variant={c.key} className={c.persons === 2 ? "h-12 w-12 shrink-0" : "h-12 w-12"} />
            <span className={c.persons === 2 ? "" : "mt-2.5 block"}>
              <span className="block font-display text-base text-ink">{c.name}</span>
              <span className="mt-0.5 block text-xs font-medium text-muted">{c.desc}</span>
            </span>
          </Link>
        ))}
      </nav>

      <p className="mt-auto pt-10 text-center text-[11px] font-medium leading-relaxed text-muted">
        AI가 명리학 기본 규칙으로 풀이해요. 회원가입 없이 바로,
        <br />
        결과는 가볍게 즐겨주세요.
      </p>
    </main>
  );
}
