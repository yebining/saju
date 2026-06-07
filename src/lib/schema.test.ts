import { describe, it, expect } from "vitest";
import { ReadingSchema, RichReadingSchema } from "./schema";

const valid = {
  score: 74,
  headline: "먼저 다가갈수록 풀리는 시기예요",
  ohaeng_note: "목·화 기운이 강해 표현이 풍부합니다.",
  strengths: [
    { title: "표현이 풍부", detail: "마음을 잘 드러내고 솔직하게 다가갑니다." },
    { title: "회복이 빠름", detail: "다툼 뒤에도 먼저 손 내미는 편입니다." },
  ],
  cautions: [{ title: "결정 미루기", detail: "금 기운이 약해 타이밍을 놓치기 쉽습니다." }],
  advice: "망설여질 땐 3일 안에 연락하세요.",
};

describe("ReadingSchema", () => {
  it("유효한 결과를 통과시킨다", () => {
    expect(ReadingSchema.safeParse(valid).success).toBe(true);
  });

  it("score 범위를 벗어나면 실패한다", () => {
    expect(ReadingSchema.safeParse({ ...valid, score: 130 }).success).toBe(false);
  });

  it("strengths가 비면 실패한다", () => {
    expect(ReadingSchema.safeParse({ ...valid, strengths: [] }).success).toBe(false);
  });

  it("relation_line은 선택값이다 (없어도 통과)", () => {
    expect(ReadingSchema.safeParse(valid).success).toBe(true);
    expect(ReadingSchema.safeParse({ ...valid, relation_line: "나 丙 × 상대 壬" }).success).toBe(true);
  });
});

const validRich = {
  score: 72,
  headline: "타고난 결을 잘 살리는 사람이에요",
  me: "차분하면서도 속에 단단한 심지가 있는 분이에요. 자기 페이스를 지키며 꾸준히 나아가는 결이 강합니다.",
  strengths: [
    { title: "꾸준함", detail: "한번 정한 방향을 오래 밀고 가는 힘이 있어요. 시간이 지날수록 신뢰가 쌓입니다." },
    { title: "균형 감각", detail: "감정과 현실 사이에서 중심을 잘 잡아요. 흔들려도 금방 제자리를 찾습니다." },
  ],
  cautions: [{ title: "혼자 끌어안기", detail: "다 짊어지려다 지칠 수 있어요. 가끔은 기대도 괜찮습니다." }],
  charm: "은근히 사람을 편하게 만드는 매력이 있어요. 처음보다 알수록 끌리는 타입입니다.",
  life_flow: {
    early: "초년은 기초를 다지는 시기예요. 다양한 경험이 훗날 밑거름이 됩니다.",
    mid: "중년에 흐름이 트여요. 쌓아온 게 결실로 이어지는 때입니다.",
    late: "장년엔 안정과 영향력이 함께 와요. 주변을 이끄는 자리에 어울립니다.",
    senior: "말년은 여유로워요. 그동안의 결이 따뜻하게 돌아옵니다.",
  },
  love: "마음을 천천히 여는 편이에요. 진득하게 곁을 지키는 인연과 잘 맞습니다.",
  work_wealth: "꾸준히 쌓는 형의 재물운이에요. 한 분야를 깊게 파는 일이 잘 맞습니다.",
  health: "큰 무리는 없되 어깨·소화 쪽을 신경 쓰면 좋아요. 규칙적인 리듬이 보약입니다.",
  helpers: "묵묵히 도와주는 연상의 인연이 힘이 돼요. 오래된 사람을 소중히 하세요.",
  now_advice: "요즘은 벌이기보다 다지는 때예요. 오늘 한 가지만 또렷이 마무리해보세요.",
};

describe("RichReadingSchema", () => {
  it("유효한 9섹션 풀이를 통과시킨다", () => {
    expect(RichReadingSchema.parse(validRich).headline).toBeTruthy();
  });
  it("life_flow 4파트가 없으면 거부한다", () => {
    const bad = { ...validRich, life_flow: { early: "초년…초년…초년…", mid: "중년…중년…중년…" } };
    expect(() => RichReadingSchema.parse(bad)).toThrow();
  });
});
