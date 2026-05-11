"use client";
import { useState } from "react";
import { PersonInput, RelationContext, FullInput } from "@/types";

type Props = { onSubmit: (input: FullInput) => void };

export function InputForm({ onSubmit }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [me, setMe] = useState<PersonInput>(initialPerson());
  const [them, setThem] = useState<PersonInput>(initialPerson());
  const [context, setContext] = useState<RelationContext>({
    knownDuration: "1_3_months",
    currentStage: "talking",
    freeNote: "",
  });

  return (
    <div className="max-w-md mx-auto p-6">
      <ProgressBar step={step} />
      {step === 1 && <PersonStep value={me} onChange={setMe} title="나의 사주" onNext={() => setStep(2)} />}
      {step === 2 && <PersonStep value={them} onChange={setThem} title="상대의 사주" onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <ContextStep value={context} onChange={setContext} onSubmit={() => onSubmit({ me, them, context })} onBack={() => setStep(2)} />}
    </div>
  );
}

function initialPerson(): PersonInput {
  return { year: 1995, month: 1, day: 1, hour: 12, minute: 0, isLunar: false, isLeapMonth: false, gender: "male" };
}

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-2 mb-6">
      {[1, 2, 3].map(i => (
        <div key={i} className={`h-1 flex-1 rounded ${i <= step ? "bg-accent" : "bg-border"}`} />
      ))}
    </div>
  );
}

function PersonStep({ value, onChange, title, onNext, onBack }: {
  value: PersonInput; onChange: (v: PersonInput) => void;
  title: string; onNext: () => void; onBack?: () => void;
}) {
  const [hourUnknown, setHourUnknown] = useState(value.hour === null);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl">{title}</h2>
      <div className="flex gap-2">
        <label><input type="radio" checked={!value.isLunar} onChange={() => onChange({ ...value, isLunar: false })} /> 양력</label>
        <label><input type="radio" checked={value.isLunar} onChange={() => onChange({ ...value, isLunar: true })} /> 음력</label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input type="number" min="1900" max="2026" value={value.year} onChange={e => onChange({ ...value, year: +e.target.value })} placeholder="년" className="bg-card border border-border p-2 rounded" />
        <input type="number" min="1" max="12" value={value.month} onChange={e => onChange({ ...value, month: +e.target.value })} placeholder="월" className="bg-card border border-border p-2 rounded" />
        <input type="number" min="1" max="31" value={value.day} onChange={e => onChange({ ...value, day: +e.target.value })} placeholder="일" className="bg-card border border-border p-2 rounded" />
      </div>
      {value.isLunar && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={value.isLeapMonth} onChange={e => onChange({ ...value, isLeapMonth: e.target.checked })} />
          윤달
        </label>
      )}
      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hourUnknown} onChange={e => {
            setHourUnknown(e.target.checked);
            onChange({ ...value, hour: e.target.checked ? null : 12, minute: e.target.checked ? null : 0 });
          }} />
          시간을 모름
        </label>
        {!hourUnknown && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input type="number" min="0" max="23" value={value.hour ?? 0} onChange={e => onChange({ ...value, hour: +e.target.value })} placeholder="시" className="bg-card border border-border p-2 rounded" />
            <input type="number" min="0" max="59" value={value.minute ?? 0} onChange={e => onChange({ ...value, minute: +e.target.value })} placeholder="분" className="bg-card border border-border p-2 rounded" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <label><input type="radio" checked={value.gender === "male"} onChange={() => onChange({ ...value, gender: "male" })} /> 남</label>
        <label><input type="radio" checked={value.gender === "female"} onChange={() => onChange({ ...value, gender: "female" })} /> 여</label>
      </div>
      <div className="flex justify-between">
        {onBack && <button onClick={onBack} className="text-muted">이전</button>}
        <button onClick={onNext} className="ml-auto bg-accent text-bg px-6 py-2 rounded">다음</button>
      </div>
    </div>
  );
}

function ContextStep({ value, onChange, onSubmit, onBack }: {
  value: RelationContext; onChange: (v: RelationContext) => void;
  onSubmit: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl">관계 맥락</h2>
      <div>
        <p className="mb-2">서로 안 지 얼마나 됐어요?</p>
        <select value={value.knownDuration} onChange={e => onChange({ ...value, knownDuration: e.target.value as RelationContext["knownDuration"] })} className="bg-card border border-border p-2 rounded w-full">
          <option value="less_than_month">한 달 미만</option>
          <option value="1_3_months">1~3개월</option>
          <option value="3_6_months">3~6개월</option>
          <option value="over_6_months">6개월 이상</option>
        </select>
      </div>
      <div>
        <p className="mb-2">지금 어떤 단계예요?</p>
        <select value={value.currentStage} onChange={e => onChange({ ...value, currentStage: e.target.value as RelationContext["currentStage"] })} className="bg-card border border-border p-2 rounded w-full">
          <option value="before_meet">아직 안 만남 (소개팅 전)</option>
          <option value="after_meet">한두 번 만남</option>
          <option value="talking">자주 연락 중</option>
          <option value="near_dating">사귈락 말락</option>
        </select>
      </div>
      <div>
        <p className="mb-2">한 줄로 더 알리고 싶은 점 (선택)</p>
        <input value={value.freeNote} onChange={e => onChange({ ...value, freeNote: e.target.value })} maxLength={80} className="bg-card border border-border p-2 rounded w-full" placeholder="예: 나이 차이가 큰 편이에요" />
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="text-muted">이전</button>
        <button onClick={onSubmit} className="bg-accent text-bg px-6 py-2 rounded">사주 보러 가기</button>
      </div>
    </div>
  );
}
