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

const pad2 = (n: number) => String(n).padStart(2, "0");
const toDateValue = (p: PersonInput) => `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
const toTimeValue = (p: PersonInput) => `${pad2(p.hour ?? 12)}:${pad2(p.minute ?? 0)}`;

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

      <div>
        <label className="mb-1 block text-sm text-muted">생년월일</label>
        <input
          type="date"
          value={toDateValue(value)}
          min="1900-01-01"
          max="2026-12-31"
          onChange={(e) => {
            const [y, m, d] = e.target.value.split("-").map(Number);
            if (y && m && d) onChange({ ...value, year: y, month: m, day: d });
          }}
          className={field}
        />
        <p className="mt-1 text-xs text-muted">
          {value.isLunar ? "고른 날짜를 음력으로 풀이해요" : "고른 날짜를 양력으로 풀이해요"}
        </p>
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
        <div>
          <label className="mb-1 block text-sm text-muted">태어난 시간</label>
          <input
            type="time"
            value={toTimeValue(value)}
            onChange={(e) => {
              const [h, mi] = e.target.value.split(":").map(Number);
              onChange({
                ...value,
                hour: Number.isFinite(h) ? h : 0,
                minute: Number.isFinite(mi) ? mi : 0,
              });
            }}
            className={field}
          />
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
