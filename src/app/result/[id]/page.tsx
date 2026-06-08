"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckInput } from "@/types";
import { getCategory } from "@/lib/categories";
import { calculateSaju, countOhaeng } from "@/lib/saju/calculate";
import { describeRelation } from "@/lib/saju/relations";
import { scoreFromOhaeng, generateDummyReading } from "@/lib/saju/reading-dummy";
import { ReadingFacts } from "@/lib/saju/reading-facts";
import { DeepReading, generateDeepBite } from "@/lib/saju/reading-deep";
import { readCache, writeCache, readingCacheKey } from "@/lib/reading-cache";
import { Reading } from "@/lib/schema";
import { RichReadingView } from "@/components/rich-reading";
import { RichReading } from "@/lib/schema";
import { RichFacts } from "@/lib/saju/reading-facts";
import { computeDaeun } from "@/lib/saju/daeun";
import { ScoreGauge } from "@/components/score-gauge";
import { BowlIcon } from "@/components/bowl-icon";
import { OhaengBar } from "@/components/ohaeng-bar";
import { ReadingSections } from "@/components/reading-sections";
import { DeeperReading } from "@/components/deeper-reading";
import { ManseTable } from "@/components/manse-table";
import { SajuPillars } from "@/lib/saju/data";

type View = {
  category: CheckInput["category"];
  mePillars: SajuPillars;
  themPillars: SajuPillars | null;
  meOhaeng: ReturnType<typeof countOhaeng>;
  themOhaeng: ReturnType<typeof countOhaeng> | null;
  reading?: Reading;
  deep?: DeepReading;
  rich?: RichReading;
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
    const score = scoreFromOhaeng(meOhaeng, input.category);
    const relationLine = themPillars
      ? `나 ${mePillars.day.stem.han}(${mePillars.day.stem.ko}) × 상대 ${themPillars.day.stem.han}(${themPillars.day.stem.ko})`
      : undefined;
    const relationOhaengNote = themPillars
      ? describeRelation(mePillars.day, themPillars.day)
      : undefined;
    const hourUnknown =
      input.me.hour === null || (!!input.them && input.them.hour === null);

    const baseView = { category: input.category, mePillars, themPillars, meOhaeng, themOhaeng, hourUnknown };

    if (input.category === "general") {
      const pf = (p: typeof mePillars.year | null) =>
        p ? { stemHan: p.stem.han, stemKo: p.stem.ko, branchHan: p.branch.han, branchKo: p.branch.ko } : null;
      const richFacts: RichFacts = {
        category: "general", score, meOhaeng, hourUnknown,
        pillars: { year: pf(mePillars.year)!, month: pf(mePillars.month)!, day: pf(mePillars.day)!, hour: pf(mePillars.hour) },
        daeun: computeDaeun(input.me),
        cacheKey: readingCacheKey(input),
      };
      const cachedG = readCache(input);
      if (cachedG?.rich) { setView({ ...baseView, rich: cachedG.rich }); return; }
      let cancelledG = false;
      (async () => {
        try {
          const res = await fetch("/api/reading", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(richFacts) });
          if (!res.ok) throw new Error(String(res.status));
          const data = await res.json() as { rich: RichReading };
          if (cancelledG) return;
          writeCache(input, { rich: data.rich });
          setView({ ...baseView, rich: data.rich });
        } catch (e) {
          if (cancelledG) return;
          console.warn("[ResultPage] rich fetch 실패, 더미:", e);
          const reading = generateDummyReading("general", meOhaeng);
          reading.score = score;
          setView({ ...baseView, reading, deep: generateDeepBite("general", meOhaeng) });
        }
      })();
      return () => { cancelledG = true; };
    }

    // 1) 캐시 우선
    const cached = readCache(input);
    if (cached) { setView({ ...baseView, ...cached }); return; }

    // 2) 서버 라우트
    const facts: ReadingFacts = {
      category: input.category, score, meOhaeng,
      themOhaeng, relationLine, relationOhaengNote, hourUnknown,
      cacheKey: readingCacheKey(input),
    };
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reading", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(facts),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json() as { reading: Reading; deep: DeepReading };
        if (cancelled) return;
        writeCache(input, data);
        setView({ ...baseView, ...data });
      } catch (e) {
        // 3) 네트워크 실패 → 로컬 더미 폴백
        if (cancelled) return;
        console.warn("[ResultPage] /api/reading 실패, 더미 폴백:", e);
        const reading = generateDummyReading(input.category, meOhaeng, { relationLine });
        reading.score = score;
        if (input.category === "relationship" && relationOhaengNote) reading.ohaeng_note = relationOhaengNote;
        setView({ ...baseView, reading, deep: generateDeepBite(input.category, meOhaeng) });
      }
    })();
    return () => { cancelled = true; };
  }, [id, router]);

  if (!view) return <div className="p-12 text-center text-muted">풀이 우려내는 중…</div>;
  const meta = getCategory(view.category);

  return (
    <main className="mx-auto max-w-md space-y-8 px-6 py-12">
      {view.hourUnknown && (
        <p className="rounded-xl border border-border bg-card px-3 py-2 text-center text-xs text-muted">
          ⏱ 시 미상으로 풀이했어요 — 시간을 알면 더 정확해져요
        </p>
      )}

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-bold text-accent shadow-sm">
          <BowlIcon variant={view.category} className="h-5 w-5" /> {meta.name}
        </span>
        <div className="mt-4"><ScoreGauge score={view.rich?.score ?? view.reading?.score ?? 0} /></div>
        <p className="mt-4 px-4 font-serif text-lg text-fg">&ldquo;{view.rich?.headline ?? view.reading?.headline ?? ""}&rdquo;</p>
        {view.reading?.relation_line && <p className="mt-2 text-sm text-muted">{view.reading.relation_line}</p>}
      </div>

      <OhaengBar count={view.meOhaeng} name={view.themOhaeng ? "나" : undefined} />
      {view.themOhaeng && <OhaengBar count={view.themOhaeng} name="상대" />}

      {view.rich ? (
        <RichReadingView rich={view.rich} />
      ) : view.reading ? (
        <>
          <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-fg/90 shadow-sm">{view.reading.ohaeng_note}</p>
          <ReadingSections reading={view.reading} />
          <DeeperReading category={view.category} count={view.meOhaeng} deep={view.deep} />
        </>
      ) : null}

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
