import { SajuPillars } from "@/lib/saju/data";

export function ManseTable({ pillars, name }: { pillars: SajuPillars; name: string }) {
  const cols = [
    { label: "시주", pillar: pillars.hour },
    { label: "일주", pillar: pillars.day, highlight: true },
    { label: "월주", pillar: pillars.month },
    { label: "연주", pillar: pillars.year },
  ];
  return (
    <div>
      <h3 className="font-serif text-xl mb-2">{name}</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>{cols.map(c => <th key={c.label} className="text-muted text-sm py-1">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            {cols.map(c => (
              <td key={c.label} className={`text-center p-3 border border-border ${c.highlight ? "bg-card" : ""}`}>
                {c.pillar ? (
                  <div>
                    <div className={`font-serif text-2xl ${c.highlight ? "text-accent" : "text-fg"}`}>{c.pillar.stem.han}</div>
                    <div className="text-xs text-muted">({c.pillar.stem.ko})</div>
                  </div>
                ) : <div className="text-muted text-sm">미상</div>}
              </td>
            ))}
          </tr>
          <tr>
            {cols.map(c => (
              <td key={c.label} className={`text-center p-3 border border-border ${c.highlight ? "bg-card" : ""}`}>
                {c.pillar ? (
                  <div>
                    <div className="font-serif text-2xl">{c.pillar.branch.han}</div>
                    <div className="text-xs text-muted">({c.pillar.branch.ko})</div>
                  </div>
                ) : <div className="text-muted text-sm">—</div>}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
