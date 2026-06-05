// 브랜드 로고: 젓가락(밥알 집힌) + 하얀 밥 담긴 밥그릇 + "사주 한 입" 워드마크.
export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
        {/* 젓가락 */}
        <path d="M11 14 L35 8.5" stroke="#C2954A" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18 L36 12.5" stroke="#D6A95B" strokeWidth="2" strokeLinecap="round" />
        {/* 젓가락에 집힌 밥알 */}
        <ellipse cx="12" cy="16" rx="2.9" ry="2.3" fill="#FFFDF9" stroke="#ECE6DA" strokeWidth="0.6" />
        {/* 밥그릇 몸통 */}
        <path d="M8 26 C8 36 15 42 24 42 C32 42 40 36 40 26 Z" fill="#8E7CC3" />
        {/* 그릇 입구 립 */}
        <ellipse cx="24" cy="26" rx="16" ry="3.6" fill="#B3A6DE" />
        {/* 하얀 밥 (봉긋) */}
        <path d="M10.5 26 C10.5 21.3 16 18.6 24 18.6 C32 18.6 37.5 21.3 37.5 26 Z" fill="#FFFDF9" />
        <ellipse cx="24" cy="26" rx="13.5" ry="2.9" fill="#FFFDF9" />
        <path d="M12.5 25.6 Q24 29.2 35.5 25.6" stroke="#ECE6DA" strokeWidth="0.9" fill="none" opacity="0.7" />
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
