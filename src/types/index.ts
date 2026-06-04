import { Category } from "@/lib/categories";

export type PersonInput = {
  year: number;
  month: number;
  day: number;
  hour: number | null;     // 시 미상이면 null
  minute: number | null;
  isLunar: boolean;
  isLeapMonth: boolean;
  gender: "male" | "female";
};

export type CheckInput = {
  category: Category;
  me: PersonInput;
  them?: PersonInput;       // relationship 카테고리에서만
  note?: string;            // 한 줄 자유 입력 (선택)
};
