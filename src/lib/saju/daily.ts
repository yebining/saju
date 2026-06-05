import { Ohaeng } from "./data";

export type DailyRelation = "same" | "supported" | "giving" | "pressured" | "empowered";
export type DailyBite = { mood: string; nudge: string; food: string; color: string; person: string };

const GENERATES: Record<Ohaeng, Ohaeng> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS: Record<Ohaeng, Ohaeng> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

/** 내 일간 오행과 오늘 일진 오행의 관계 (다섯 갈래, 명리 용어 비노출) */
export function relate(my: Ohaeng, today: Ohaeng): DailyRelation {
  if (my === today) return "same";
  if (GENERATES[today] === my) return "supported"; // 오늘이 나를 생함
  if (GENERATES[my] === today) return "giving"; // 내가 오늘을 생함
  if (CONTROLS[today] === my) return "pressured"; // 오늘이 나를 극함
  return "empowered"; // 내가 오늘을 극함
}

const MOOD: Record<DailyRelation, { mood: string; nudge: string }> = {
  same: { mood: "오늘은 평소의 당신과 결이 잘 맞는 하루예요. 무리 없이 흐름을 타기 좋겠네요.", nudge: "익숙한 방식대로 차분히 움직여보세요." },
  supported: { mood: "오늘은 주변에서 당신을 챙겨주는 기운이 흘러요. 도움을 청하면 생각보다 쉽게 풀리겠네요.", nudge: "혼자 끙끙대지 말고, 가까운 사람에게 기대보기 좋은 날이에요." },
  giving: { mood: "오늘은 당신의 에너지가 밖으로 잘 뻗는 날이에요. 표현하고 베풀수록 돌아오는 게 많겠네요.", nudge: "미뤄둔 연락이나 표현, 오늘 먼저 건네보기 좋아요." },
  pressured: { mood: "오늘은 살짝 눌리는 듯한 기운이 있어요. 욕심내기보다 한 박자 쉬어가면 좋겠네요.", nudge: "큰 결정은 잠시 미루고, 페이스를 지키는 데 집중해보세요." },
  empowered: { mood: "오늘은 당신이 주도권을 쥐기 좋은 날이에요. 미뤄둔 일을 밀어붙이면 잘 풀리겠네요.", nudge: "망설이던 일, 오늘 한 걸음 먼저 내디뎌보세요." },
};

const COLOR: Record<Ohaeng, string> = { wood: "청록색", fire: "다홍색", earth: "노란색", metal: "흰색", water: "남색" };
const FOOD: Record<Ohaeng, string[]> = {
  wood: ["비빔밥", "나물 한 접시", "쑥떡"],
  fire: ["떡볶이", "마라탕", "토마토 파스타"],
  earth: ["된장찌개", "감자전", "호박죽"],
  metal: ["흰쌀밥", "두부 요리", "배 한 조각"],
  water: ["미역국", "검은콩밥", "시원한 물 한 잔"],
};
const PERSON = ["오래된 친구", "직장 선배", "부모님", "새로운 인연", "가까운 후배", "옛 동료"];

export function dailyFortune(args: { myDayOhaeng: Ohaeng; todayDayOhaeng: Ohaeng; daySeed: number }): DailyBite {
  const rel = relate(args.myDayOhaeng, args.todayDayOhaeng);
  const { mood, nudge } = MOOD[rel];
  const seed = Math.abs(Math.trunc(args.daySeed));
  const foods = FOOD[args.todayDayOhaeng];
  return {
    mood,
    nudge,
    color: COLOR[args.todayDayOhaeng],
    food: foods[seed % foods.length],
    person: PERSON[seed % PERSON.length],
  };
}
