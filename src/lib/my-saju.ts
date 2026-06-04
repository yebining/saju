import { PersonInput } from "@/types";

// 내 사주 정보를 브라우저(localStorage)에 저장한다. 한 번 입력하면 다음에 재사용.
const KEY = "saju:my";

export function loadMySaju(): PersonInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersonInput) : null;
  } catch {
    return null;
  }
}

export function saveMySaju(person: PersonInput): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(person));
}

export function clearMySaju(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
