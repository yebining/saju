import { RichReading } from "@/lib/schema";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-bold text-accent">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-fg/90">{children}</div>
    </section>
  );
}

export function RichReadingView({ rich }: { rich: RichReading }) {
  return (
    <div className="space-y-3">
      <Block title="나라는 사람">{rich.me}</Block>
      <Block title="타고난 강점">
        <ul className="space-y-2">
          {rich.strengths.map((s, i) => (<li key={i}><b className="text-fg">{s.title}</b> — {s.detail}</li>))}
        </ul>
      </Block>
      <Block title="보완하면 좋은 점">
        <ul className="space-y-2">
          {rich.cautions.map((c, i) => (<li key={i}><b className="text-fg">{c.title}</b> — {c.detail}</li>))}
        </ul>
      </Block>
      <Block title="내 매력">{rich.charm}</Block>
      <Block title="인생 흐름">
        <div className="space-y-2">
          <p><b className="text-fg">초년</b> — {rich.life_flow.early}</p>
          <p><b className="text-fg">중년</b> — {rich.life_flow.mid}</p>
          <p><b className="text-fg">장년</b> — {rich.life_flow.late}</p>
          <p><b className="text-fg">말년</b> — {rich.life_flow.senior}</p>
        </div>
      </Block>
      <Block title="사랑·결혼">{rich.love}</Block>
      <Block title="일·재물">{rich.work_wealth}</Block>
      <Block title="건강">{rich.health}</Block>
      <Block title="나를 돕는 귀인">{rich.helpers}</Block>
      <Block title="요즘 흐름 + 조언">{rich.now_advice}</Block>
    </div>
  );
}
