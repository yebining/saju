import Link from "next/link";
import { MySajuCard } from "@/components/my-saju-card";

type Category = {
  key: string;
  emoji: string;
  name: string;
  desc: string;
  wide?: boolean;
};

const CATEGORIES: Category[] = [
  { key: "general", emoji: "🌿", name: "종합 사주", desc: "타고난 기운의 균형" },
  { key: "love", emoji: "💗", name: "연애운", desc: "지금의 연애 흐름" },
  { key: "wealth", emoji: "💰", name: "재물운", desc: "돈과 기회의 결" },
  { key: "health", emoji: "🍀", name: "건강운", desc: "몸과 컨디션의 기운" },
  { key: "relationship", emoji: "🫶", name: "관계 궁합", desc: "두 사람의 합·충·생·극", wide: true },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-14">
      <header className="mb-10 text-center">
        <p className="text-sm text-muted">안녕하세요 👋</p>
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
              c.wide ? "col-span-2" : ""
            }`}
          >
            <span className="block text-2xl">{c.emoji}</span>
            <span className="mt-2 block font-bold text-fg group-hover:text-accent">
              {c.name}
            </span>
            <span className="mt-0.5 block text-xs text-muted">{c.desc}</span>
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
