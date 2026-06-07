import { Solar, Lunar, LunarYear } from "lunar-javascript";
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  SajuPillars,
  Pillar,
  OhaengCount,
  Ohaeng,
} from "./data";

export type SajuInput = {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
  isLunar: boolean;
  isLeapMonth: boolean;
};

const findStem = (han: string) => HEAVENLY_STEMS.find((s) => s.han === han)!;
const findBranch = (han: string) => EARTHLY_BRANCHES.find((b) => b.han === han)!;

// 진태양시 보정: 한국 표준시(동경 135°) → 출생지(서울 126.978°E) 태양시 ≈ -32분.
// (135 - 126.978) × 4분 ≈ 32.1 → 32분.
const SOLAR_TIME_OFFSET_MIN = 32;

export function calculateSaju(input: SajuInput): SajuPillars {
  // 1. 입력을 양력(Solar) 기준으로 변환
  let solar;
  if (input.isLunar) {
    // lunar-javascript는 윤달을 음수 month로 표현한다 (예: 2023 윤2월 → month = -2).
    // 참고: node_modules/lunar-javascript/lunar.js 의 LunarMonth.isLeap() = (month < 0)
    let lunarMonth = input.month;
    if (input.isLeapMonth) {
      const leap = LunarYear.fromYear(input.year).getLeapMonth();
      if (leap !== input.month) {
        throw new Error(
          `${input.year}년에는 윤${input.month}월이 존재하지 않습니다.`
        );
      }
      lunarMonth = -input.month;
    }
    const lunar = Lunar.fromYmd(input.year, lunarMonth, input.day);
    solar = lunar.getSolar();
  } else {
    solar = Solar.fromYmd(input.year, input.month, input.day);
  }

  // 2. 시간 정보 + 진태양시 보정 (시각을 아는 경우에만; 모르면 정오 기준)
  let hour = input.hour ?? 12;
  let minute = input.minute ?? 0;
  let baseSolar = solar;
  if (input.hour !== null) {
    let total = hour * 60 + minute - SOLAR_TIME_OFFSET_MIN;
    let dayShift = 0;
    while (total < 0) { total += 1440; dayShift -= 1; }
    while (total >= 1440) { total -= 1440; dayShift += 1; }
    hour = Math.floor(total / 60);
    minute = total % 60;
    if (dayShift !== 0) baseSolar = solar.next(dayShift); // lunar-javascript Solar.next(days)
  }
  const solarWithTime = Solar.fromYmdHms(
    baseSolar.getYear(),
    baseSolar.getMonth(),
    baseSolar.getDay(),
    hour,
    minute,
    0
  );

  // 3. EightChar(사주 8자) 추출
  const eightChar = solarWithTime.getLunar().getEightChar();

  const yearPillar: Pillar = {
    stem: findStem(eightChar.getYearGan()),
    branch: findBranch(eightChar.getYearZhi()),
  };
  const monthPillar: Pillar = {
    stem: findStem(eightChar.getMonthGan()),
    branch: findBranch(eightChar.getMonthZhi()),
  };
  const dayPillar: Pillar = {
    stem: findStem(eightChar.getDayGan()),
    branch: findBranch(eightChar.getDayZhi()),
  };

  let hourPillar: Pillar | null = null;
  if (input.hour !== null) {
    hourPillar = {
      stem: findStem(eightChar.getTimeGan()),
      branch: findBranch(eightChar.getTimeZhi()),
    };
  }

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };
}

export function countOhaeng(pillars: SajuPillars): OhaengCount {
  const count: OhaengCount = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const list = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(
    Boolean
  ) as Pillar[];
  for (const p of list) {
    count[p.stem.ohaeng as Ohaeng]++;
    count[p.branch.ohaeng as Ohaeng]++;
  }
  return count;
}
