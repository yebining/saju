import { Category } from "@/lib/categories";
import { OhaengCount } from "@/lib/saju/data";
import { generateDeepBite, DeepReading } from "@/lib/saju/reading-deep";

export function DeeperReading({
  category,
  count,
  deep,
}: {
  category: Category;
  count: OhaengCount;
  deep?: DeepReading;
}) {
  const sections = (deep ?? generateDeepBite(category, count)).sections;
  return (
    <div className="space-y-3">
      <details className="rounded-2xl border border-border bg-card shadow-sm">
        <summary className="cursor-pointer list-none p-4 text-base font-bold text-accent">
          🥢 한 입 더 <span className="text-xs font-normal text-muted">— 무료로 더 깊은 풀이 보기</span>
        </summary>
        <div className="space-y-4 px-4 pb-4">
          {sections.map((s, i) => (
            <section key={i}>
              <h4 className="text-sm font-bold text-fg">{s.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-fg/90">{s.body}</p>
            </section>
          ))}
        </div>
      </details>

      <div className="rounded-2xl border border-dashed border-accent/40 bg-accent-soft p-4 text-center">
        <p className="font-bold text-accent">🍱 사주 한 상 (정식 풀이)</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          곧 만나요 — 올해 흐름과 시기별 운까지 한 상 가득 차려드릴게요. (준비 중)
        </p>
      </div>
    </div>
  );
}
