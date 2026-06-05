"use client";
import { useEffect, useState } from "react";
import { loadMySaju } from "@/lib/my-saju";
import { calculateSaju } from "@/lib/saju/calculate";
import { dailyFortune, DailyBite } from "@/lib/saju/daily";
import { Ohaeng } from "@/lib/saju/data";

export function TodayBite() {
  const [bite, setBite] = useState<DailyBite | null>(null);

  useEffect(() => {
    const me = loadMySaju();
    if (!me) return;
    try {
      const myDay = calculateSaju(me).day;
      const now = new Date();
      const todayDay = calculateSaju({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: 12,
        minute: 0,
        isLunar: false,
        isLeapMonth: false,
      }).day;
      setBite(
        dailyFortune({
          myDayOhaeng: myDay.stem.ohaeng as Ohaeng,
          todayDayOhaeng: todayDay.stem.ohaeng as Ohaeng,
          daySeed: Math.floor(now.getTime() / 86400000),
        })
      );
    } catch {
      setBite(null);
    }
  }, []);

  if (!bite) return null;

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-bold text-accent">☀️ 오늘의 한 입</p>
      <p className="mt-2 leading-relaxed text-fg">{bite.mood}</p>

      <div className="mt-4 rounded-xl bg-accent-soft p-3">
        <p className="text-sm font-bold text-accent">🎯 오늘의 작은 한 입</p>
        <p className="mt-1 text-sm text-fg/90">{bite.nudge}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { emoji: "🍙", label: "오늘의 음식", value: bite.food },
          { emoji: "🎨", label: "오늘의 색깔", value: bite.color },
          { emoji: "🫶", label: "오늘의 사람", value: bite.person },
        ].map((it) => (
          <div key={it.label} className="rounded-xl bg-bg p-2">
            <p className="text-base">{it.emoji}</p>
            <p className="mt-1 text-[11px] text-muted">{it.label}</p>
            <p className="text-xs font-bold text-fg">{it.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
