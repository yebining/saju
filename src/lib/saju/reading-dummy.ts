import { OhaengCount } from "./data";
import { Category } from "../categories";
import { Reading, RichReading } from "../schema";
import { RichFacts } from "./reading-facts";

const BIAS: Record<Category, number> = {
  general: 0, love: 2, wealth: -2, health: 1, relationship: 0,
};

/** 오행이 고를수록 높은 점수 (40~95 클램프). 결정론적. */
export function scoreFromOhaeng(count: OhaengCount, category: Category): number {
  const vals = [count.wood, count.fire, count.earth, count.metal, count.water];
  const total = vals.reduce((a, b) => a + b, 0) || 1;
  const ideal = total / 5;
  const variance = vals.reduce((s, v) => s + Math.abs(v - ideal), 0);
  const raw = Math.round(100 - (variance / total) * 40) + BIAS[category];
  return Math.max(40, Math.min(95, raw));
}

export const STRONG_LABEL: Record<string, string> = {
  wood: "성장·추진력", fire: "표현·열정", earth: "안정·신뢰", metal: "결단·원칙", water: "유연·지혜",
};

export const KO_LABEL: Record<keyof OhaengCount, string> = {
  wood: "목", fire: "화", earth: "토", metal: "금", water: "수",
};

export function dominant(count: OhaengCount): keyof OhaengCount {
  return (Object.keys(count) as (keyof OhaengCount)[]).reduce((a, b) => (count[b] > count[a] ? b : a));
}
export function weakest(count: OhaengCount): keyof OhaengCount {
  return (Object.keys(count) as (keyof OhaengCount)[]).reduce((a, b) => (count[b] < count[a] ? b : a));
}

const CAT_HEADLINE: Record<Category, string> = {
  general: "타고난 균형이 당신의 무기예요",
  love: "먼저 다가갈수록 풀리는 시기예요",
  wealth: "흐름을 읽으면 기회가 와요",
  health: "리듬을 지키면 든든한 한 해예요",
  relationship: "서로의 결이 맞물리는 사이예요",
};

/** 키 없이도 결과 화면을 채우는 결정론적 더미 풀이. Phase 2 LLM 폴백 겸용. */
export function generateDummyReading(
  category: Category,
  count: OhaengCount,
  opts?: { relationLine?: string }
): Reading {
  const score = scoreFromOhaeng(count, category);
  const dom = dominant(count);
  const weak = weakest(count);

  const reading: Reading = {
    score,
    headline: CAT_HEADLINE[category],
    ohaeng_note: `${STRONG_LABEL[dom]}의 ${KO_LABEL[dom]} 기운이 두드러지고, ${KO_LABEL[weak]} 기운은 보완이 필요해요.`,
    strengths: [
      { title: STRONG_LABEL[dom], detail: `${KO_LABEL[dom]} 기운이 강해 이 분야에서 자기다움이 잘 드러납니다.` },
      { title: "회복 탄력성", detail: "기운의 흐름이 막혀도 스스로 균형을 되찾는 편입니다." },
    ],
    cautions: [
      { title: `${KO_LABEL[weak]} 기운 부족`, detail: `${KO_LABEL[weak]} 기운이 약해 결정·마무리에서 아쉬움이 생길 수 있어요.` },
    ],
    advice: "오늘 한 가지만 정해 작게 실천해보세요. 사주는 흐름이라 방향이 더 중요해요.",
  };
  if (category === "relationship" && opts?.relationLine) {
    reading.relation_line = opts.relationLine;
  }
  return reading;
}

/** 키 없음/실패 시 종합 화면을 채우는 결정론적 9섹션 더미. */
export function dummyRich(facts: RichFacts): RichReading {
  const dom = dominant(facts.meOhaeng);
  const s = (t: string) => `${t} 지금은 흐름을 차분히 살피기 좋은 때예요. 무리하지 않고 자기 결을 지키면 한결 부드러워집니다.`;
  return {
    score: facts.score,
    headline: "타고난 결을 차분히 살리는 사람이에요",
    me: s("타고난 기운이 한쪽으로 또렷한 편이에요."),
    strengths: [
      { title: STRONG_LABEL[dom], detail: `${KO_LABEL[dom]} 기운이 강해 그 분야에서 자기다움이 잘 드러나요. 꾸준히 밀고 가는 힘이 있습니다.` },
      { title: "회복 탄력성", detail: "흐름이 막혀도 스스로 균형을 되찾는 편이에요. 시간이 지날수록 단단해집니다." },
    ],
    cautions: [{ title: "혼자 끌어안기", detail: "다 짊어지려다 지칠 수 있어요. 가끔은 곁에 기대도 괜찮습니다." }],
    charm: s("은근히 사람을 편하게 만드는 매력이 있어요."),
    life_flow: {
      early: "초년은 기초를 다지는 시기예요. 다양한 경험이 훗날의 밑거름이 됩니다.",
      mid: "중년에 흐름이 트여요. 쌓아온 것이 결실로 이어지는 때입니다.",
      late: "장년엔 안정과 영향력이 함께 와요. 주변을 이끄는 자리에 어울립니다.",
      senior: "말년은 여유로워요. 그동안의 결이 따뜻하게 돌아옵니다.",
    },
    love: s("마음을 천천히 여는 편이에요."),
    work_wealth: s("꾸준히 쌓아가는 결의 재물운이에요."),
    health: s("규칙적인 리듬이 가장 큰 보약이에요."),
    helpers: s("묵묵히 곁을 지켜주는 인연이 큰 힘이 돼요."),
    now_advice: "오늘 한 가지만 정해 작게 마무리해보세요. 사주는 흐름이라 방향이 더 중요해요.",
  };
}
