// 브랜드 로고: 젓가락 얹은 밥그릇 + "사주 한 입" 워드마크.
export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
        {/* 젓가락 */}
        <path d="M11 14 L35 8.5" stroke="#C2954A" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18 L36 12.5" stroke="#D6A95B" strokeWidth="2" strokeLinecap="round" />
        {/* 밥그릇 */}
        <path d="M8 26 C8 36 15 42 24 42 C33 42 40 36 40 26 Z" fill="#8E7CC3" />
        <ellipse cx="24" cy="26" rx="16" ry="3.6" fill="#B3A6DE" />
        <ellipse cx="24" cy="26" rx="11.5" ry="2.1" fill="#7B68B6" opacity="0.5" />
        {/* 얼굴 */}
        <circle cx="19.5" cy="31" r="1.6" fill="#4A3B30" />
        <circle cx="28.5" cy="31" r="1.6" fill="#4A3B30" />
        <path d="M21 34 Q24 36.6 27 34" stroke="#4A3B30" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="15.6" cy="33" r="1.7" fill="#E8A0B0" opacity="0.55" />
        <circle cx="32.4" cy="33" r="1.7" fill="#E8A0B0" opacity="0.55" />
      </svg>
      <span className="font-serif text-xl font-bold text-accent">사주 한 입</span>
    </div>
  );
}
