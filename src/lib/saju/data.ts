export const HEAVENLY_STEMS = [
  { ko: "갑", han: "甲", ohaeng: "wood",  yinyang: "yang" },
  { ko: "을", han: "乙", ohaeng: "wood",  yinyang: "yin"  },
  { ko: "병", han: "丙", ohaeng: "fire",  yinyang: "yang" },
  { ko: "정", han: "丁", ohaeng: "fire",  yinyang: "yin"  },
  { ko: "무", han: "戊", ohaeng: "earth", yinyang: "yang" },
  { ko: "기", han: "己", ohaeng: "earth", yinyang: "yin"  },
  { ko: "경", han: "庚", ohaeng: "metal", yinyang: "yang" },
  { ko: "신", han: "辛", ohaeng: "metal", yinyang: "yin"  },
  { ko: "임", han: "壬", ohaeng: "water", yinyang: "yang" },
  { ko: "계", han: "癸", ohaeng: "water", yinyang: "yin"  },
] as const;

export const EARTHLY_BRANCHES = [
  { ko: "자", han: "子", ohaeng: "water", animal: "쥐" },
  { ko: "축", han: "丑", ohaeng: "earth", animal: "소" },
  { ko: "인", han: "寅", ohaeng: "wood",  animal: "호랑이" },
  { ko: "묘", han: "卯", ohaeng: "wood",  animal: "토끼" },
  { ko: "진", han: "辰", ohaeng: "earth", animal: "용" },
  { ko: "사", han: "巳", ohaeng: "fire",  animal: "뱀" },
  { ko: "오", han: "午", ohaeng: "fire",  animal: "말" },
  { ko: "미", han: "未", ohaeng: "earth", animal: "양" },
  { ko: "신", han: "申", ohaeng: "metal", animal: "원숭이" },
  { ko: "유", han: "酉", ohaeng: "metal", animal: "닭" },
  { ko: "술", han: "戌", ohaeng: "earth", animal: "개" },
  { ko: "해", han: "亥", ohaeng: "water", animal: "돼지" },
] as const;

export type Stem = typeof HEAVENLY_STEMS[number];
export type Branch = typeof EARTHLY_BRANCHES[number];
export type Pillar = { stem: Stem; branch: Branch };

export type SajuPillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
};

export type Ohaeng = "wood" | "fire" | "earth" | "metal" | "water";
export type OhaengCount = Record<Ohaeng, number>;
