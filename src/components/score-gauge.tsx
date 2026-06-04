import { scoreLabel } from "@/lib/categories";

/** 0~100 점수를 원형 게이지로. r=52, 둘레≈326.7 */
export function ScoreGauge({ score }: { score: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = C * (1 - clamped / 100);
  return (
    <div className="relative mx-auto h-32 w-32">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#EBD9C7" strokeWidth="11" />
        <circle cx="64" cy="64" r={R} fill="none" stroke="#B5562F" strokeWidth="11"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl leading-none text-accent">{clamped}</span>
        <span className="mt-1 text-xs text-muted">{scoreLabel(clamped)}</span>
      </div>
    </div>
  );
}
