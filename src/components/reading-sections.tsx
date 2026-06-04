import { Reading } from "@/lib/schema";

function CardList({ icon, title, items }: { icon: string; title: string; items: Reading["strengths"] }) {
  return (
    <section className="space-y-2">
      <h3 className="text-base text-fg">{icon} {title}</h3>
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-1 font-bold text-accent">{it.title}</p>
          <p className="text-sm leading-relaxed text-fg/90">{it.detail}</p>
        </div>
      ))}
    </section>
  );
}

export function ReadingSections({ reading }: { reading: Reading }) {
  return (
    <div className="space-y-6">
      <CardList icon="✨" title="강점" items={reading.strengths} />
      <CardList icon="⚠️" title="주의할 점" items={reading.cautions} />
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-1 text-base text-fg">💡 한 줄 조언</h3>
        <p className="text-sm leading-relaxed text-fg/90">{reading.advice}</p>
      </section>
    </div>
  );
}
