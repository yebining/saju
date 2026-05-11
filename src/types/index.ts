export type PersonInput = {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
  isLunar: boolean;
  isLeapMonth: boolean;
  gender: "male" | "female";
};

export type RelationContext = {
  knownDuration: "less_than_month" | "1_3_months" | "3_6_months" | "over_6_months";
  currentStage: "before_meet" | "after_meet" | "talking" | "near_dating";
  freeNote: string;
};

export type FullInput = {
  me: PersonInput;
  them: PersonInput;
  context: RelationContext;
};
