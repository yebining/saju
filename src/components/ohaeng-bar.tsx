import { OhaengCount } from "@/lib/saju/data";

const COLORS = { wood: "#7BA77E", fire: "#C75A4A", earth: "#B89F6E", metal: "#A8A8A8", water: "#5476A8" };
const LABELS = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

export function OhaengBar({ count }: { count: OhaengCount }) {
  const total = count.wood + count.fire + count.earth + count.metal + count.water;
  return (
    <div className="flex h-3 rounded-full overflow-hidden">
      {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map(key => (
        <div key={key} style={{ width: `${(count[key] / total) * 100}%`, backgroundColor: COLORS[key] }} title={`${LABELS[key]} ${count[key]}`} />
      ))}
    </div>
  );
}
