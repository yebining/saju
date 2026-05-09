import { Solar, Lunar } from "lunar-javascript";
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

export function calculateSaju(input: SajuInput): SajuPillars {
  // 1. 입력을 양력(Solar) 기준으로 변환
  let solar;
  if (input.isLunar) {
    const lunar = Lunar.fromYmd(input.year, input.month, input.day);
    solar = lunar.getSolar();
  } else {
    solar = Solar.fromYmd(input.year, input.month, input.day);
  }

  // 2. 시간 정보 부여 (시 미상이면 정오 12:00 기본값으로 연/월/일 기둥만 안정적으로 산출)
  const hour = input.hour ?? 12;
  const minute = input.minute ?? 0;
  const solarWithTime = Solar.fromYmdHms(
    solar.getYear(),
    solar.getMonth(),
    solar.getDay(),
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
