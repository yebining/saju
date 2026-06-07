import { Solar, Lunar } from "lunar-javascript";
import { PersonInput } from "@/types";

export type DaeunPeriod = { startAge: number; endAge: number; startYear: number; ganzhi: string };

/** 대운(10년 주기) 계산. lunar-javascript EightChar.getYun(gender).getDaYun() 사용.
 *  간지가 빈(입운 전) 항목은 제외한다. 대운은 시각 영향이 작아 정오 기준으로 안정화. */
export function computeDaeun(input: PersonInput): DaeunPeriod[] {
  let solar;
  if (input.isLunar) {
    solar = Lunar.fromYmd(input.year, input.month, input.day).getSolar();
  } else {
    solar = Solar.fromYmd(input.year, input.month, input.day);
  }
  const ec = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 12, 0, 0)
    .getLunar().getEightChar();
  const gender = input.gender === "male" ? 1 : 0; // lunar-javascript: 1=남, 0=여
  const da = ec.getYun(gender).getDaYun();
  const out: DaeunPeriod[] = [];
  for (const d of da) {
    const ganzhi = d.getGanZhi();
    if (!ganzhi) continue; // 입운 전(빈 간지) 제외
    out.push({ startAge: d.getStartAge(), endAge: d.getEndAge(), startYear: d.getStartYear(), ganzhi });
  }
  return out;
}
