import { Pillar, Ohaeng } from "./data";

const SHENG: Record<string, string> = {
  "wood-fire":  "목생화 — 따뜻하게 키워주는 관계",
  "fire-earth": "화생토 — 안정시켜주는 관계",
  "earth-metal":"토생금 — 길러내주는 관계",
  "metal-water":"금생수 — 흐르게 해주는 관계",
  "water-wood": "수생목 — 자라게 해주는 관계",
};
const KE: Record<string, string> = {
  "wood-earth": "목극토 — 휘어잡는 관계, 갈등 가능",
  "earth-water":"토극수 — 막아세우는 관계, 답답할 수 있음",
  "water-fire": "수극화 — 식혀주는 관계, 균형이 필요",
  "fire-metal": "화극금 — 녹이는 관계, 자극이 강함",
  "metal-wood": "금극목 — 잘라내는 관계, 부딪힘 주의",
};

export function describeRelation(myDay: Pillar, theirDay: Pillar): string {
  const a = myDay.stem.ohaeng as Ohaeng;
  const b = theirDay.stem.ohaeng as Ohaeng;
  if (a === b) return `같은 ${a} 기운 — 비슷해서 편하지만 자극은 적은 관계`;
  return SHENG[`${a}-${b}`] || SHENG[`${b}-${a}`] ||
         KE[`${a}-${b}`] || KE[`${b}-${a}`] ||
         "오행이 멀어 자극이 적은 관계";
}
