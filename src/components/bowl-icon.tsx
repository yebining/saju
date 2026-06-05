import { Category } from "@/lib/categories";

// 카테고리별 밥그릇 캐릭터 아이콘. 라벤더 밥그릇 + 웃는 얼굴 + variant별 토핑.
const BOWL = "#8E7CC3";
const BOWL_INNER = "#7B68B6";
const RIM = "#B3A6DE";
const FACE = "#4A3B30";
const CHEEK = "#E8A0B0";

function Topping({ variant }: { variant: Category }) {
  switch (variant) {
    case "general": // 새싹
      return (
        <g>
          <path d="M24 28 V18" stroke="#6FA873" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M24 23 C20 23 17 20 17 16.5 C21 16.5 24 18.5 24 22 Z" fill="#7BA77E" />
          <path d="M24 25 C28 25 31 22 31 18.5 C27 18.5 24 20.5 24 24 Z" fill="#93BD96" />
        </g>
      );
    case "love": // 하트
      return (
        <path
          d="M24 28 C24 23.5 17.5 22 17.5 17.5 C17.5 14.8 20.5 13.8 24 17 C27.5 13.8 30.5 14.8 30.5 17.5 C30.5 22 24 23.5 24 28 Z"
          fill="#E8826E"
        />
      );
    case "wealth": // 동전
      return (
        <g>
          <circle cx="24" cy="20" r="7" fill="#D6A95B" />
          <circle cx="24" cy="20" r="7" fill="none" stroke="#C2954A" strokeWidth="1.4" />
          <path
            d="M21 17.5 L24 21 L27 17.5 M24 21 V24 M22 22.2 H26"
            stroke="#8A6A2F"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    case "health": // 클로버
      return (
        <g fill="#7BA77E">
          <circle cx="20" cy="20" r="4" />
          <circle cx="28" cy="20" r="4" />
          <circle cx="24" cy="15.5" r="4" />
          <path d="M24 22 V28" stroke="#6FA873" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "relationship": // 두 하트
      return (
        <g fill="#E8826E">
          <path d="M19 27 C19 24 15 23 15 20 C15 18.2 17 17.5 19 19.6 C21 17.5 23 18.2 23 20 C23 23 19 24 19 27 Z" />
          <path d="M29 27 C29 24 25 23 25 20 C25 18.2 27 17.5 29 19.6 C31 17.5 33 18.2 33 20 C33 23 29 24 29 27 Z" fill="#D98AC0" />
        </g>
      );
  }
}

export function BowlIcon({ variant, className }: { variant: Category; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
      <Topping variant={variant} />
      {/* 밥그릇 몸통 */}
      <path d="M9 30 C9 39 15 44 24 44 C33 44 39 39 39 30 Z" fill={BOWL} />
      {/* 그릇 입구 */}
      <ellipse cx="24" cy="30" rx="15" ry="3.4" fill={RIM} />
      <ellipse cx="24" cy="30" rx="11" ry="2" fill={BOWL_INNER} opacity="0.5" />
      {/* 얼굴 */}
      <circle cx="19.5" cy="35" r="1.5" fill={FACE} />
      <circle cx="28.5" cy="35" r="1.5" fill={FACE} />
      <path d="M21 38 Q24 40.4 27 38" stroke={FACE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="15.8" cy="37" r="1.6" fill={CHEEK} opacity="0.55" />
      <circle cx="32.2" cy="37" r="1.6" fill={CHEEK} opacity="0.55" />
    </svg>
  );
}
