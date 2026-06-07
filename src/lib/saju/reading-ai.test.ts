import { describe, it, expect, vi, beforeEach } from "vitest";

const parseMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse: parseMock };
  },
}));

import { generateReading } from "./reading-ai";
import type { ReadingFacts } from "./reading-facts";

const aiOutput = {
  score: 5,
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

beforeEach(() => {
  parseMock.mockReset();
  process.env.ANTHROPIC_API_KEY = "test-key";
});

describe("generateReading", () => {
  it("AI 점수를 계산값으로 덮어쓴다", async () => {
    parseMock.mockResolvedValue({ parsed_output: aiOutput });
    const { reading } = await generateReading(facts);
    expect(reading.score).toBe(68);
  });

  it("기본 풀이와 한 입 더를 함께 반환한다", async () => {
    parseMock.mockResolvedValue({ parsed_output: aiOutput });
    const { reading, deep } = await generateReading(facts);
    expect(reading.headline.length).toBeGreaterThan(3);
    expect(deep.sections.length).toBeGreaterThanOrEqual(2);
  });

  it("관계 궁합이면 relation_line·ohaeng_note를 계산값으로 세팅한다", async () => {
    parseMock.mockResolvedValue({ parsed_output: aiOutput });
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

  it("parsed_output 이 없으면 throw 한다 (라우트가 폴백하도록)", async () => {
    parseMock.mockResolvedValue({ parsed_output: null });
    await expect(generateReading(facts)).rejects.toThrow();
  });
});
