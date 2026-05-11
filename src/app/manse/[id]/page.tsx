"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { calculateSaju, countOhaeng } from "@/lib/saju/calculate";
import { describeRelation } from "@/lib/saju/relations";
import { ManseTable } from "@/components/manse-table";
import { OhaengBar } from "@/components/ohaeng-bar";
import { FullInput } from "@/types";

export default function MansePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [input, setInput] = useState<FullInput | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("saju_input");
    if (!raw) {
      router.push("/check");
      return;
    }
    setInput(JSON.parse(raw));
  }, [router]);

  if (!input) return <div className="text-center p-12 text-muted">불러오는 중…</div>;

  const mePillars = calculateSaju(input.me);
  const themPillars = calculateSaju(input.them);
  const meOhaeng = countOhaeng(mePillars);
  const themOhaeng = countOhaeng(themPillars);
  const relation = describeRelation(mePillars.day, themPillars.day);

  const handleProceed = () => router.push(`/result/${id}`);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-serif text-center">두 분의 사주</h1>
      <div className="space-y-6">
        <div>
          <ManseTable pillars={mePillars} name="나" />
          <div className="mt-2"><OhaengBar count={meOhaeng} /></div>
        </div>
        <div>
          <ManseTable pillars={themPillars} name="상대" />
          <div className="mt-2"><OhaengBar count={themOhaeng} /></div>
        </div>
      </div>
      <div className="bg-card border border-border rounded p-4 text-center">
        <p className="font-serif text-lg">{relation}</p>
      </div>
      <button onClick={handleProceed} className="w-full bg-accent text-bg py-3 rounded font-bold">
        이 사주로 궁합 풀이 받기 →
      </button>
    </div>
  );
}
