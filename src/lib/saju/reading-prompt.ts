import { getCategory } from "../categories";
import type { ReadingFacts, RichFacts } from "./reading-facts";

const KO_OHAENG: Record<string, string> = {
  wood: "목(나무)",
  fire: "화(불)",
  earth: "토(흙)",
  metal: "금(쇠)",
  water: "수(물)",
};

const CATEGORY_FOCUS: Record<string, string> = {
  general: "타고난 기운의 전체 균형과 성향",
  love: "지금의 연애 흐름과 마음의 결",
  wealth: "돈과 기회를 보는 감각, 재물의 흐름",
  health: "몸과 컨디션, 에너지의 리듬",
  relationship: "두 사람 사이의 합과 결, 관계의 온도",
};

export function buildSystemPrompt(): string {
  return [
    "당신은 따뜻한 명리학 해석가입니다. 사용자의 사주(천간·지지 기둥과 오행 분포)를 명리학 규칙으로 해석합니다.",
    "",
    "규칙:",
    "1. 말투는 다정한 '오늘의 운세'체입니다. '~하네요', '~하길 바랍니다'처럼 부드럽게.",
    "2. 명리 용어를 절대 표면에 노출하지 마세요. '수생목', '비겁', '식상', '편관', '상생/상극', 'wood/fire' 같은 단어 금지. 해석은 내부에서만 하고, 사용자에겐 쉬운 일상어 문장으로만 전달합니다.",
    "3. 점수(score)는 이미 계산되어 주어집니다. 그 숫자를 바꾸지 말고, 그 점수와 어울리는 톤으로 풀이하세요.",
    "4. 신비주의·겁주기 없이 진지하고 다정하게. 단정이 아니라 흐름과 방향을 이야기합니다.",
    "5. 모든 출력은 한국어입니다.",
  ].join("\n");
}

export function buildUserPrompt(facts: ReadingFacts): string {
  const cat = getCategory(facts.category);
  const ohaeng = (c: ReadingFacts["meOhaeng"]) =>
    (Object.keys(KO_OHAENG) as (keyof typeof c)[])
      .map((k) => `${KO_OHAENG[k]} ${c[k]}`)
      .join(", ");

  const lines = [
    `카테고리: ${cat.name} — 초점: ${CATEGORY_FOCUS[facts.category]}`,
    `점수: ${facts.score} (이 숫자는 고정, 바꾸지 마세요)`,
    `내 오행 분포: ${ohaeng(facts.meOhaeng)}`,
  ];
  if (facts.hourUnknown) lines.push("참고: 태어난 시각 미상 — 단정적이지 않게 풀이하세요.");
  if (facts.category === "relationship" && facts.themOhaeng) {
    lines.push(`상대 오행 분포: ${ohaeng(facts.themOhaeng)}`);
    if (facts.relationLine) lines.push(`두 사람: ${facts.relationLine}`);
    if (facts.relationOhaengNote)
      lines.push(`관계의 결(내부 참고): ${facts.relationOhaengNote}`);
  }
  lines.push("", "위 사주를 바탕으로 풀이를 생성하세요.");
  return lines.join("\n");
}

export function buildRichSystemPrompt(): string {
  return [
    "당신은 따뜻한 명리학 해석가입니다. 사용자의 사주(천간·지지 8글자)와 대운(시기별 운)을 명리학 규칙으로 해석해 '종합 사주' 풀이를 만듭니다.",
    "",
    "규칙:",
    "1. 말투는 다정한 '오늘의 운세'체('~하네요', '~하길 바랍니다'). 신비주의·겁주기 없음.",
    "2. 명리 용어를 절대 표면에 쓰지 마세요('수생목/비겁/식상/편관/상생상극/도화살/천을귀인/역마' 등 금지, wood/fire 같은 영어 키도 금지). 해석은 내부에서만, 사용자에겐 쉬운 일상어로.",
    "3. 점수(score)는 이미 계산되어 주어집니다. 바꾸지 말고 그 점수와 어울리는 톤으로.",
    "4. '인생 흐름(초년·중년·장년·말년)'은 주어진 대운 흐름에 근거해 쓰세요. 나이를 단정해 틀리지 말고 흐름 위주로.",
    "5. 매력·귀인·조심할 결 등은 '주제'로만 풀고, 특정 신살 이름을 단정하지 마세요.",
    "6. 모든 출력은 한국어.",
    "",
    "출력은 아래 JSON 객체 '하나만'(코드펜스·설명 없이 순수 JSON):",
    "{",
    '  "headline": "4~40자 한 줄 총평",',
    '  "me": "40~320자, 나라는 사람(타고난 성향)",',
    '  "strengths": [{ "title": "2~24자", "detail": "10~220자" }],  // 2~3개',
    '  "cautions": [{ "title": "2~24자", "detail": "10~220자" }],   // 1~2개',
    '  "charm": "30~260자, 내 매력",',
    '  "life_flow": { "early": "초년", "mid": "중년", "late": "장년", "senior": "말년" }, // 각 20~220자',
    '  "love": "30~260자, 사랑·결혼",',
    '  "work_wealth": "30~260자, 일·재물",',
    '  "health": "30~260자, 건강",',
    '  "helpers": "30~260자, 나를 돕는 귀인",',
    '  "now_advice": "30~260자, 요즘 흐름 + 실천 조언"',
    "}",
    "score 필드는 넣지 마세요(외부에서 계산).",
  ].join("\n");
}

export function buildRichUserPrompt(facts: RichFacts): string {
  const KO_OHAENG: Record<string, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
  const pil = (p: { stemHan: string; stemKo: string; branchHan: string; branchKo: string } | null) =>
    p ? `${p.stemHan}${p.branchHan}(${p.stemKo}${p.branchKo})` : "(시 미상)";
  const ohaeng = (Object.keys(KO_OHAENG) as (keyof typeof facts.meOhaeng)[])
    .map((k) => `${KO_OHAENG[k]} ${facts.meOhaeng[k]}`).join(", ");
  const daeun = facts.daeun.map((d) => `${d.startAge}~${d.endAge}세 ${d.ganzhi}`).join(" / ");
  const lines = [
    `점수: ${facts.score} (고정, 바꾸지 마세요)`,
    `사주 8글자 — 연주 ${pil(facts.pillars.year)}, 월주 ${pil(facts.pillars.month)}, 일주 ${pil(facts.pillars.day)}, 시주 ${pil(facts.pillars.hour)}`,
    `오행 분포: ${ohaeng}`,
    `대운(시기별): ${daeun || "정보 없음"}`,
  ];
  if (facts.hourUnknown) lines.push("참고: 태어난 시각 미상 — 시기·시간 관련은 단정 말고 부드럽게.");
  lines.push("", "위 사주를 바탕으로 9섹션 종합 풀이 JSON을 생성하세요.");
  return lines.join("\n");
}
