import { Category } from "@/lib/categories";

// 카테고리별 밥그릇 캐릭터 아이콘. 라벤더 밥그릇 + 하얀 밥 + 웃는 얼굴 + variant별 토핑.
const BOWL = "#8E7CC3";
const RIM = "#B3A6DE";
const RICE = "#FFFDF9";
const RICE_SHADE = "#ECE6DA";
const FACE = "#4A3B30";
const CHEEK = "#E8A0B0";

function Topping({ variant }: { variant: Category }) {
  switch (variant) {
    case "general": // 새싹
      return (
        <g>
          <path d="M24 25 V16" stroke="#6FA873" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M24 20 C20 20 17 17 17 13.5 C21 13.5 24 15.5 24 19 Z" fill="#7BA77E" />
          <path d="M24 22 C28 22 31 19 31 15.5 C27 15.5 24 17.5 24 21 Z" fill="#93BD96" />
        </g>
      );
    case "love": // 하트
      return (
        <path
          d="M24 25 C24 20.5 17.5 19 17.5 14.5 C17.5 11.8 20.5 10.8 24 14 C27.5 10.8 30.5 11.8 30.5 14.5 C30.5 19 24 20.5 24 25 Z"
          fill="#E8826E"
        />
      );
    case "wealth": // 동전
      return (
        <g>
          <circle cx="24" cy="17" r="7" fill="#D6A95B" />
          <circle cx="24" cy="17" r="7" fill="none" stroke="#C2954A" strokeWidth="1.4" />
          <path
            d="M21 14.5 L24 18 L27 14.5 M24 18 V21 M22 19.2 H26"
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
          <circle cx="20" cy="17" r="4" />
          <circle cx="28" cy="17" r="4" />
          <circle cx="24" cy="12.5" r="4" />
          <path d="M24 19 V25" stroke="#6FA873" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "relationship": // 두 하트
      return (
        <g fill="#E8826E">
          <path d="M19 24 C19 21 15 20 15 17 C15 15.2 17 14.5 19 16.6 C21 14.5 23 15.2 23 17 C23 20 19 21 19 24 Z" />
          <path d="M29 24 C29 21 25 20 25 17 C25 15.2 27 14.5 29 16.6 C31 14.5 33 15.2 33 17 C33 20 29 21 29 24 Z" fill="#D98AC0" />
        </g>
      );
  }
}

export function BowlIcon({ variant, className }: { variant: Category; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
      {/* 밥그릇 몸통 */}
      <path d="M9 30 C9 39 15 44 24 44 C33 44 39 39 39 30 Z" fill={BOWL} />
      {/* 그릇 입구 립 */}
      <ellipse cx="24" cy="30" rx="15" ry="3.4" fill={RIM} />
      {/* 하얀 밥 (봉긋) */}
      <path d="M11.5 30 C11.5 25.2 17 22.6 24 22.6 C31 22.6 36.5 25.2 36.5 30 Z" fill={RICE} />
      <ellipse cx="24" cy="30" rx="12.5" ry="2.7" fill={RICE} />
      <path d="M13.5 29.6 Q24 33 34.5 29.6" stroke={RICE_SHADE} strokeWidth="0.9" fill="none" opacity="0.7" />
      {/* 토핑 (밥 위에) */}
      <Topping variant={variant} />
      {/* 얼굴 */}
      <circle cx="19.5" cy="35.5" r="1.5" fill={FACE} />
      <circle cx="28.5" cy="35.5" r="1.5" fill={FACE} />
      <path d="M21 38.5 Q24 40.8 27 38.5" stroke={FACE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="15.8" cy="37.5" r="1.6" fill={CHEEK} opacity="0.55" />
      <circle cx="32.2" cy="37.5" r="1.6" fill={CHEEK} opacity="0.55" />
    </svg>
  );
}
