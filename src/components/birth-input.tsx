"use client";
import { useState } from "react";
import { PersonInput } from "@/types";

export function emptyPerson(): PersonInput {
  return { year: 1995, month: 1, day: 1, hour: 12, minute: 0, isLunar: false, isLeapMonth: false, gender: "female" };
}

type Props = {
  value: PersonInput;
  onChange: (v: PersonInput) => void;
  title: string;
};

const field = "w-full rounded-xl border border-border bg-card p-3 text-center text-base text-fg outline-none focus:border-accent";

export function BirthInput({ value, onChange, title }: Props) {
  const [hourUnknown, setHourUnknown] = useState(value.hour === null);

  return (
    <div className="space-y-4">
      <h2 className="text-xl text-fg">{title}</h2>

      <div className="flex gap-2 rounded-xl bg-border/40 p-1">
        {[false, true].map((lunar) => (
          <button
            key={String(lunar)}
            type="button"
            onClick={() => onChange({ ...value, isLunar: lunar })}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              value.isLunar === lunar ? "bg-card text-accent shadow-sm" : "text-muted"
            }`}
          >
            {lunar ? "음력" : "양력"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input type="number" inputMode="numeric" min={1900} max={2026} value={value.year}
          onChange={(e) => onChange({ ...value, year: +e.target.value })} placeholder="년" className={field} />
        <input type="number" inputMode="numeric" min={1} max={12} value={value.month}
          onChange={(e) => onChange({ ...value, month: +e.target.value })} placeholder="월" className={field} />
        <input type="number" inputMode="numeric" min={1} max={31} value={value.day}
          onChange={(e) => onChange({ ...value, day: +e.target.value })} placeholder="일" className={field} />
      </div>

      {value.isLunar && (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={value.isLeapMonth}
            onChange={(e) => onChange({ ...value, isLeapMonth: e.target.checked })} />
          윤달이에요
        </label>
      )}

      <label className="flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" checked={hourUnknown}
          onChange={(e) => {
            setHourUnknown(e.target.checked);
            onChange({ ...value, hour: e.target.checked ? null : 12, minute: e.target.checked ? null : 0 });
          }} />
        태어난 시간을 몰라요 <span className="text-muted">(괜찮아요!)</span>
      </label>

      {!hourUnknown && (
        <div className="grid grid-cols-2 gap-2">
          <input type="number" inputMode="numeric" min={0} max={23} value={value.hour ?? 0}
            onChange={(e) => onChange({ ...value, hour: +e.target.value })} placeholder="시" className={field} />
          <input type="number" inputMode="numeric" min={0} max={59} value={value.minute ?? 0}
            onChange={(e) => onChange({ ...value, minute: +e.target.value })} placeholder="분" className={field} />
        </div>
      )}

      <div className="flex gap-2 rounded-xl bg-border/40 p-1">
        {(["female", "male"] as const).map((g) => (
          <button key={g} type="button" onClick={() => onChange({ ...value, gender: g })}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              value.gender === g ? "bg-card text-accent shadow-sm" : "text-muted"
            }`}>
            {g === "female" ? "여성" : "남성"}
          </button>
        ))}
      </div>
    </div>
  );
}
