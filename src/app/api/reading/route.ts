import { ReadingFactsSchema } from "@/lib/saju/reading-facts";
import { generateReading } from "@/lib/saju/reading-ai";
import { generateDummyReading } from "@/lib/saju/reading-dummy";
import { generateDeepBite } from "@/lib/saju/reading-deep";

export async function POST(request: Request) {
  let facts;
  try {
    facts = ReadingFactsSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid facts" }, { status: 400 });
  }

  // 키 없으면 호출 없이 더미
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(dummy(facts));
  }

  try {
    const result = await generateReading(facts);
    return Response.json(result);
  } catch (e) {
    console.error("[/api/reading] AI 실패, 더미 폴백:", e);
    return Response.json(dummy(facts));
  }
}

function dummy(facts: ReturnType<typeof ReadingFactsSchema.parse>) {
  const reading = generateDummyReading(facts.category, facts.meOhaeng, {
    relationLine: facts.relationLine,
  });
  reading.score = facts.score;
  if (facts.category === "relationship" && facts.relationOhaengNote) {
    reading.ohaeng_note = facts.relationOhaengNote;
  }
  return { reading, deep: generateDeepBite(facts.category, facts.meOhaeng) };
}
