import Link from "next/link";
import { notFound } from "next/navigation";

const CATEGORY_NAMES: Record<string, string> = {
  general: "종합 사주",
  love: "연애운",
  wealth: "재물운",
  health: "건강운",
  relationship: "관계 궁합",
};

export default async function CheckPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const name = CATEGORY_NAMES[category];
  if (!name) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm font-bold text-accent">{name}</p>
      <h1 className="mt-3 text-2xl text-fg">생일을 알려주세요 🎂</h1>
      <div className="mt-8 w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-4xl">🛠️</p>
        <p className="mt-4 leading-relaxed text-muted">
          입력 화면을 만드는 중이에요.
          <br />
          곧 여기서 사주를 풀 수 있게 됩니다.
        </p>
      </div>
      <Link href="/" className="mt-8 text-sm text-muted underline-offset-4 hover:text-accent hover:underline">
        ← 처음으로
      </Link>
    </main>
  );
}
