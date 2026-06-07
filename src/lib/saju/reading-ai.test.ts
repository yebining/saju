import { describe, it, expect, vi, beforeEach } from "vitest";

// @google/genai 모킹: models.generateContent 만 사용.
// 래퍼 화살표함수로 호출 시점에 generateContentMock 참조(vitest 호이스팅 안전).
const generateContentMock = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: (...args: unknown[]) => generateContentMock(...args) };
  },
}));

import { generateReading } from "./reading-ai";
import type { ReadingFacts } from "./reading-facts";

// 모델이 내보내는 JSON 본문(점수 없음 — 외부에서 계산).
const aiOutput = {
  headline: "먼저 다가갈수록 풀리는 시기예요",
  ohaeng_note: "표현하는 기운이 강해 마음이 잘 드러나요.",
  strengths: [
    { title: "표현력", detail: "마음을 솔직하게 드러내는 힘이 있어요. 그게 관계에서 강점이 됩니다." },
    { title: "회복력", detail: "감정의 출렁임이 있어도 스스로 균형을 되찾는 편이에요." },
  ],
  cautions: [{ title: "조급함 주의", detail: "서두르면 아쉬움이 남을 수 있어요. 한 박자 쉬어가세요." }],
  advice: "오늘 한 가지만 정해 작게 표현해보세요. 흐름이 한결 부드러워집니다.",
  deep_sections: [
    { title: "요즘 당신의 흐름", body: "마음이 먼저 움직이는 시기예요. 표현하는 힘이 잘 살아나는 때라 솔직함이 통합니다." },
    { title: "이런 결정이 잘 맞아요", body: "익숙하고 잘하는 영역에서 한 걸음 더 나아가 보세요. 새로 벌이기보다 또렷하게 마무리하는 쪽이 좋아요." },
  ],
};

const facts: ReadingFacts = {
  category: "love",
  score: 68,
  meOhaeng: { wood: 3, fire: 2, earth: 1, metal: 0, water: 2 },
  hourUnknown: false,
};

function reply(text: string) {
  return { text };
}

beforeEach(() => {
  generateContentMock.mockReset();
  process.env.GEMINI_API_KEY = "test-key";
});

describe("generateReading (Gemini)", () => {
  it("점수를 계산값으로 덮어쓰고, 비관계는 ohaeng_note를 AI 출력 그대로 둔다", async () => {
    generateContentMock.mockResolvedValue(reply(JSON.stringify(aiOutput)));
    const { reading } = await generateReading(facts);
    expect(reading.score).toBe(68); // AI엔 score 없음 → facts.score
    expect(reading.ohaeng_note).toBe(aiOutput.ohaeng_note);
  });

  it("기본 풀이와 한 입 더를 함께 반환한다", async () => {
    generateContentMock.mockResolvedValue(reply(JSON.stringify(aiOutput)));
    const { reading, deep } = await generateReading(facts);
    expect(reading.headline.length).toBeGreaterThan(3);
    expect(deep.sections.length).toBeGreaterThanOrEqual(2);
  });

  it("코드펜스로 감싼 JSON도 파싱한다", async () => {
    generateContentMock.mockResolvedValue(reply("```json\n" + JSON.stringify(aiOutput) + "\n```"));
    const { reading } = await generateReading(facts);
    expect(reading.headline).toBe(aiOutput.headline);
  });

  it("관계 궁합이면 relation_line·ohaeng_note를 계산값으로 세팅한다", async () => {
    generateContentMock.mockResolvedValue(reply(JSON.stringify(aiOutput)));
    const { reading } = await generateReading({
      ...facts,
      category: "relationship",
      themOhaeng: { wood: 1, fire: 1, earth: 2, metal: 2, water: 1 },
      relationLine: "나 甲(갑) × 상대 丙(병)",
      relationOhaengNote: "목생화 — 따뜻하게 키워주는 관계",
    });
    expect(reading.relation_line).toBe("나 甲(갑) × 상대 丙(병)");
    expect(reading.ohaeng_note).toBe("목생화 — 따뜻하게 키워주는 관계");
  });

  it("빈 응답이면 throw 한다 (라우트가 폴백하도록)", async () => {
    generateContentMock.mockResolvedValue(reply(""));
    await expect(generateReading(facts)).rejects.toThrow();
  });

  it("JSON이 아니면 throw 한다", async () => {
    generateContentMock.mockResolvedValue(reply("그냥 텍스트입니다"));
    await expect(generateReading(facts)).rejects.toThrow();
  });
});

import { generateRichReading } from "./reading-ai";
import type { RichFacts } from "./reading-facts";

const richAiOutput = {
  headline: "타고난 결을 잘 살리는 사람이에요",
  me: "차분하면서도 속에 단단한 심지가 있는 분이에요. 자기 페이스를 지키며 꾸준히 나아갑니다.",
  strengths: [
    { title: "꾸준함", detail: "한번 정한 방향을 오래 밀고 가는 힘이 있어요. 시간이 지날수록 신뢰가 쌓입니다." },
    { title: "균형 감각", detail: "감정과 현실 사이 중심을 잘 잡아요. 흔들려도 금방 제자리를 찾습니다." },
  ],
  cautions: [{ title: "혼자 끌어안기", detail: "다 짊어지려다 지칠 수 있어요. 가끔은 기대도 괜찮습니다." }],
  charm: "은근히 사람을 편하게 만드는 매력이 있어요. 알수록 끌리는 타입입니다.",
  life_flow: {
    early: "초년은 기초를 다지는 시기예요. 다양한 경험이 밑거름이 됩니다.",
    mid: "중년에 흐름이 트여요. 쌓아온 게 결실로 이어집니다.",
    late: "장년엔 안정과 영향력이 함께 와요. 쌓아온 것들이 빛납니다.",
    senior: "말년은 여유로워요. 결이 따뜻하게 돌아옵니다.",
  },
  love: "마음을 천천히 여는 편이에요. 진득한 인연과 잘 맞습니다.",
  work_wealth: "꾸준히 쌓는 재물운이에요. 한 분야를 깊게 파면 좋습니다.",
  health: "어깨·소화 쪽을 신경 쓰면 좋아요. 규칙적인 리듬이 보약입니다.",
  helpers: "묵묵히 도와주는 연상의 인연이 힘이 돼요. 곁에 두면 좋습니다.",
  now_advice: "벌이기보다 다지는 때예요. 오늘 한 가지만 또렷이 마무리해보세요.",
};

const richFacts2: RichFacts = {
  category: "general", score: 72, hourUnknown: false,
  meOhaeng: { wood: 2, fire: 0, earth: 1, metal: 1, water: 4 },
  pillars: {
    year: { stemHan: "己", stemKo: "기", branchHan: "卯", branchKo: "묘" },
    month: { stemHan: "壬", stemKo: "임", branchHan: "申", branchKo: "신" },
    day: { stemHan: "癸", stemKo: "계", branchHan: "卯", branchKo: "묘" },
    hour: { stemHan: "壬", stemKo: "임", branchHan: "子", branchKo: "자" },
  },
  daeun: [{ startAge: 8, endAge: 17, startYear: 2006, ganzhi: "癸酉" }],
};

describe("generateRichReading", () => {
  it("9섹션을 반환하고 점수를 계산값으로 덮어쓴다", async () => {
    generateContentMock.mockResolvedValue(reply(JSON.stringify(richAiOutput)));
    const rich = await generateRichReading(richFacts2);
    expect(rich.score).toBe(72);
    expect(rich.life_flow.early.length).toBeGreaterThan(10);
    expect(rich.helpers.length).toBeGreaterThan(10);
  });
  it("JSON 불일치면 throw 한다", async () => {
    generateContentMock.mockResolvedValue(reply("그냥 텍스트"));
    await expect(generateRichReading(richFacts2)).rejects.toThrow();
  });
});
