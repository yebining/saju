import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { BowlIcon } from "@/components/bowl-icon";
import { BrandLogo } from "@/components/brand-logo";
import { MySajuCard } from "@/components/my-saju-card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-14">
      <header className="mb-10 text-center">
        <BrandLogo className="mb-6" />
        <h1 className="mt-2 text-3xl leading-snug text-fg">
          오늘은
          <br />
          <span className="text-accent">뭐가 궁금하세요?</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          생일만 알려주면 AI가 당신의 사주를
          <br />
          따뜻하게 풀어드려요.
        </p>
      </header>

      <MySajuCard />

      <nav className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/check/${c.key}`}
            className={`group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md ${
              c.persons === 2 ? "col-span-2 flex items-center gap-3" : ""
            }`}
          >
            <BowlIcon variant={c.key} className={c.persons === 2 ? "h-11 w-11 shrink-0" : "h-10 w-10"} />
            <span className={c.persons === 2 ? "" : "mt-2 block"}>
              <span className="block font-bold text-fg group-hover:text-accent">{c.name}</span>
              <span className="mt-0.5 block text-xs text-muted">{c.desc}</span>
            </span>
          </Link>
        ))}
      </nav>

      <p className="mt-auto pt-10 text-center text-xs leading-relaxed text-muted">
        명리학 기본 규칙으로 풀이해요. 회원가입 없이 바로,
        <br />
        결과는 7일간만 보관됩니다.
      </p>
    </main>
  );
}
