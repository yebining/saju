import { ReadingFactsSchema, RichFactsSchema } from "@/lib/saju/reading-facts";
import { generateReading, generateRichReading } from "@/lib/saju/reading-ai";
import { generateDummyReading, dummyRich } from "@/lib/saju/reading-dummy";
import { generateDeepBite } from "@/lib/saju/reading-deep";
import { getStoredReading, storeReading } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "invalid facts" }, { status: 400 });

  // 종합(general)은 Rich 경로
  if (body.category === "general") {
    let facts;
    try { facts = RichFactsSchema.parse(body); }
    catch { return Response.json({ error: "invalid facts" }, { status: 400 }); }

    // 1) 저장된 결과 우선 (있으면 재생성 없음 = 항상 같은 결과 + 비용 0)
    if (facts.cacheKey) {
      const stored = await getStoredReading(facts.cacheKey);
      if (stored?.kind === "rich") return Response.json({ rich: stored.data });
    }
    if (!process.env.GEMINI_API_KEY) return Response.json({ rich: dummyRich(facts) });
    try {
      const rich = await generateRichReading(facts);
      if (facts.cacheKey) await storeReading(facts.cacheKey, "general", { kind: "rich", data: rich });
      return Response.json({ rich });
    } catch (e) {
      console.error("[/api/reading] Rich AI 실패, 더미 폴백:", e);
      return Response.json({ rich: dummyRich(facts) });
    }
  }

  // 그 외 카테고리: 기존 경로 (+ 저장)
  let facts;
  try { facts = ReadingFactsSchema.parse(body); }
  catch { return Response.json({ error: "invalid facts" }, { status: 400 }); }

  if (facts.cacheKey) {
    const stored = await getStoredReading(facts.cacheKey);
    if (stored?.kind === "basic") return Response.json(stored.data);
  }
  if (!process.env.GEMINI_API_KEY) return Response.json(dummy(facts));
  try {
    const result = await generateReading(facts);
    if (facts.cacheKey) await storeReading(facts.cacheKey, facts.category, { kind: "basic", data: result });
    return Response.json(result);
  } catch (e) {
    console.error("[/api/reading] AI 실패, 더미 폴백:", e);
    return Response.json(dummy(facts));
  }
}

function dummy(facts: ReturnType<typeof ReadingFactsSchema.parse>) {
  const reading = generateDummyReading(facts.category, facts.meOhaeng, { relationLine: facts.relationLine });
  reading.score = facts.score;
  if (facts.category === "relationship" && facts.relationOhaengNote) reading.ohaeng_note = facts.relationOhaengNote;
  return { reading, deep: generateDeepBite(facts.category, facts.meOhaeng) };
}
