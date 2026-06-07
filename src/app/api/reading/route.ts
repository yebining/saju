import { ReadingFactsSchema, RichFactsSchema } from "@/lib/saju/reading-facts";
import { generateReading, generateRichReading } from "@/lib/saju/reading-ai";
import { generateDummyReading, dummyRich } from "@/lib/saju/reading-dummy";
import { generateDeepBite } from "@/lib/saju/reading-deep";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "invalid facts" }, { status: 400 });

  // 종합(general)은 Rich 경로
  if (body.category === "general") {
    let facts;
    try { facts = RichFactsSchema.parse(body); }
    catch { return Response.json({ error: "invalid facts" }, { status: 400 }); }
    if (!process.env.GEMINI_API_KEY) return Response.json({ rich: dummyRich(facts) });
    try {
      return Response.json({ rich: await generateRichReading(facts) });
    } catch (e) {
      console.error("[/api/reading] Rich AI 실패, 더미 폴백:", e);
      return Response.json({ rich: dummyRich(facts) });
    }
  }

  // 그 외 카테고리: 기존 경로
  let facts;
  try { facts = ReadingFactsSchema.parse(body); }
  catch { return Response.json({ error: "invalid facts" }, { status: 400 }); }
  if (!process.env.GEMINI_API_KEY) return Response.json(dummy(facts));
  try { return Response.json(await generateReading(facts)); }
  catch (e) { console.error("[/api/reading] AI 실패, 더미 폴백:", e); return Response.json(dummy(facts)); }
}

function dummy(facts: ReturnType<typeof ReadingFactsSchema.parse>) {
  const reading = generateDummyReading(facts.category, facts.meOhaeng, { relationLine: facts.relationLine });
  reading.score = facts.score;
  if (facts.category === "relationship" && facts.relationOhaengNote) reading.ohaeng_note = facts.relationOhaengNote;
  return { reading, deep: generateDeepBite(facts.category, facts.meOhaeng) };
}
