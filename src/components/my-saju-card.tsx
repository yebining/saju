"use client";
import { useEffect, useState } from "react";
import { PersonInput } from "@/types";
import { loadMySaju, saveMySaju, clearMySaju } from "@/lib/my-saju";
import { BirthInput, emptyPerson } from "./birth-input";

function describe(p: PersonInput): string {
  const date = `${p.year}. ${p.month}. ${p.day}.`;
  const cal = p.isLunar ? " 음력" : "";
  return `${date}${cal}`;
}

export function MySajuCard() {
  const [me, setMe] = useState<PersonInput | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PersonInput>(emptyPerson());

  useEffect(() => {
    setMe(loadMySaju());
  }, []);

  if (editing) {
    return (
      <div className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <BirthInput value={draft} onChange={setDraft} title="내 사주 정보" />
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              saveMySaju(draft);
              setMe(draft);
              setEditing(false);
            }}
            className="flex-1 rounded-xl bg-accent py-3 font-bold text-white"
          >
            저장
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-xl border border-border px-5 py-3 text-sm text-muted"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <button
        onClick={() => {
          setDraft(emptyPerson());
          setEditing(true);
        }}
        className="mb-8 w-full rounded-2xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted transition hover:border-accent hover:text-accent"
      >
        + 내 사주 정보를 저장하면, 다음부턴 바로 결과를 볼 수 있어요
      </button>
    );
  }

  return (
    <div className="mb-8 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div>
        <p className="text-xs text-muted">내 사주</p>
        <p className="font-bold text-fg">🗓 {describe(me)}</p>
      </div>
      <div className="flex gap-3 text-sm">
        <button
          onClick={() => {
            setDraft(me);
            setEditing(true);
          }}
          className="text-accent"
        >
          ✎ 수정
        </button>
        <button
          onClick={() => {
            clearMySaju();
            setMe(null);
          }}
          className="text-muted"
        >
          지우기
        </button>
      </div>
    </div>
  );
}
