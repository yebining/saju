"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isCategory, getCategory } from "@/lib/categories";
import { BirthInput, emptyPerson } from "@/components/birth-input";
import { PersonInput, CheckInput } from "@/types";
import { loadMySaju, saveMySaju } from "@/lib/my-saju";

export default function CheckPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const router = useRouter();
  const [me, setMe] = useState<PersonInput>(emptyPerson());
  const [them, setThem] = useState<PersonInput>(emptyPerson());
  const [step, setStep] = useState<1 | 2>(1);
  const [ready, setReady] = useState(false);

  // 내 사주가 저장돼 있으면 불러온다. 1인 카테고리는 곧바로 결과로 보낸다(재입력 불필요).
  useEffect(() => {
    if (!isCategory(category)) {
      setReady(true);
      return;
    }
    const saved = loadMySaju();
    if (saved) setMe(saved);
    if (saved && getCategory(category).persons === 1) {
      const input: CheckInput = { category, me: saved };
      const id = crypto.randomUUID();
      sessionStorage.setItem(`saju:${id}`, JSON.stringify(input));
      router.replace(`/result/${id}`);
      return;
    }
    setReady(true);
  }, [category, router]);

  if (!isCategory(category)) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted">알 수 없는 카테고리예요.</p>
        <Link href="/" className="mt-4 inline-block text-accent">← 처음으로</Link>
      </main>
    );
  }

  const meta = getCategory(category);
  const twoPerson = meta.persons === 2;

  if (!ready) {
    return <div className="p-12 text-center text-muted">내 사주 불러오는 중…</div>;
  }

  const submit = () => {
    saveMySaju(me); // 내 정보 저장(다음에 재사용)
    const input: CheckInput = { category, me, ...(twoPerson ? { them } : {}) };
    const id = crypto.randomUUID();
    sessionStorage.setItem(`saju:${id}`, JSON.stringify(input));
    router.push(`/result/${id}`);
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <p className="text-sm font-bold text-accent">{meta.emoji} {meta.name}</p>
      <h1 className="mt-1 mb-6 text-2xl text-fg">{meta.question}</h1>

      {twoPerson && (
        <div className="mb-6 flex gap-2">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded ${s <= step ? "bg-accent" : "bg-border"}`} />
          ))}
        </div>
      )}

      {(!twoPerson || step === 1) && (
        <BirthInput value={me} onChange={setMe} title={twoPerson ? "나의 생일" : "생일을 알려주세요 🎂"} />
      )}
      {twoPerson && step === 2 && (
        <BirthInput value={them} onChange={setThem} title="상대의 생일" />
      )}

      <div className="mt-8 flex items-center justify-between">
        {twoPerson && step === 2 ? (
          <button onClick={() => setStep(1)} className="text-sm text-muted">← 이전</button>
        ) : <span />}
        {twoPerson && step === 1 ? (
          <button onClick={() => setStep(2)} className="rounded-xl bg-accent px-6 py-3 font-bold text-white">다음 →</button>
        ) : (
          <button onClick={submit} className="rounded-xl bg-accent px-6 py-3 font-bold text-white">
            {meta.name} 보기 →
          </button>
        )}
      </div>

      <Link href="/" className="mt-8 block text-center text-sm text-muted hover:text-accent">← 처음으로</Link>
    </main>
  );
}
