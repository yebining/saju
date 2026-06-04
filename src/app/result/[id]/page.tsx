"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckInput } from "@/types";
import { getCategory } from "@/lib/categories";
import { calculateSaju, countOhaeng } from "@/lib/saju/calculate";
import { describeRelation } from "@/lib/saju/relations";
import { generateDummyReading } from "@/lib/saju/reading-dummy";
import { Reading } from "@/lib/schema";
import { ScoreGauge } from "@/components/score-gauge";
import { OhaengBar } from "@/components/ohaeng-bar";
import { ReadingSections } from "@/components/reading-sections";
import { ManseTable } from "@/components/manse-table";
import { SajuPillars } from "@/lib/saju/data";

type View = {
  category: CheckInput["category"];
  mePillars: SajuPillars;
  themPillars: SajuPillars | null;
  meOhaeng: ReturnType<typeof countOhaeng>;
  themOhaeng: ReturnType<typeof countOhaeng> | null;
  reading: Reading;
  hourUnknown: boolean;
};

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`saju:${id}`);
    if (!raw) { router.replace("/not-found"); return; }
    const input: CheckInput = JSON.parse(raw);
    const mePillars = calculateSaju(input.me);
    const meOhaeng = countOhaeng(mePillars);
    const themPillars = input.them ? calculateSaju(input.them) : null;
    const themOhaeng = themPillars ? countOhaeng(themPillars) : null;
    const relationLine = themPillars
      ? `나 ${mePillars.day.stem.han}(${mePillars.day.stem.ko}) × 상대 ${themPillars.day.stem.han}(${themPillars.day.stem.ko})`
      : undefined;
    const reading = generateDummyReading(input.category, meOhaeng, { relationLine });
    if (input.category === "relationship" && themPillars) {
      reading.ohaeng_note = describeRelation(mePillars.day, themPillars.day);
    }
    setView({
      category: input.category, mePillars, themPillars, meOhaeng, themOhaeng, reading,
      hourUnknown: input.me.hour === null || (!!input.them && input.them.hour === null),
    });
  }, [id, router]);

  if (!view) return <div className="p-12 text-center text-muted">풀이 불러오는 중…</div>;
  const meta = getCategory(view.category);

  return (
    <main className="mx-auto max-w-md space-y-8 px-6 py-12">
      {view.hourUnknown && (
        <p className="rounded-xl border border-border bg-card px-3 py-2 text-center text-xs text-muted">
          ⏱ 시 미상으로 풀이했어요 — 시간을 알면 더 정확해져요
        </p>
      )}

      <div className="text-center">
        <span className="inline-block rounded-full bg-card px-3 py-1 text-xs font-bold text-accent shadow-sm">
          {meta.emoji} {meta.name}
        </span>
        <div className="mt-4"><ScoreGauge score={view.reading.score} /></div>
        <p className="mt-4 px-4 font-serif text-lg text-fg">&ldquo;{view.reading.headline}&rdquo;</p>
        {view.reading.relation_line && <p className="mt-2 text-sm text-muted">{view.reading.relation_line}</p>}
      </div>

      <OhaengBar count={view.meOhaeng} name={view.themOhaeng ? "나" : undefined} />
      {view.themOhaeng && <OhaengBar count={view.themOhaeng} name="상대" />}

      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-fg/90 shadow-sm">
        {view.reading.ohaeng_note}
      </p>

      <ReadingSections reading={view.reading} />

      <details className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-bold text-muted">내 사주 자세히 보기</summary>
        <div className="mt-4 space-y-6">
          <ManseTable pillars={view.mePillars} name="나" />
          {view.themPillars && <ManseTable pillars={view.themPillars} name="상대" />}
        </div>
      </details>

      <p className="pt-4 text-center text-xs leading-relaxed text-muted">
        AI가 명리학 기본 규칙으로 풀이한 결과예요. 인생의 결정은 결국 본인의 몫이에요.
      </p>
      <Link href="/" className="block text-center text-sm text-muted hover:text-accent">처음으로</Link>
    </main>
  );
}
