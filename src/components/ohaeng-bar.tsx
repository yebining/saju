import { OhaengCount } from "@/lib/saju/data";

const COLORS = { wood: "#7BA77E", fire: "#C75A4A", earth: "#B89F6E", metal: "#A8A8A8", water: "#5476A8" };
const LABELS = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
type Key = keyof typeof COLORS;

export function OhaengBar({ count, name }: { count: OhaengCount; name?: string }) {
  const max = Math.max(...(Object.keys(COLORS) as Key[]).map((k) => count[k]), 1);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold text-muted">{name ? `${name}의 ` : ""}오행 밸런스</p>
      <div className="flex h-16 items-end gap-2">
        {(Object.keys(COLORS) as Key[]).map((k) => (
          <div key={k} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t-md transition-all"
              style={{ height: `${Math.max((count[k] / max) * 100, 4)}%`, backgroundColor: COLORS[k] }} />
            <span className="text-xs text-fg">{LABELS[k]} {count[k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
