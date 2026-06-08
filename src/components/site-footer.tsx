import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { BowlIcon } from "@/components/bowl-icon";

/** 사이트 공통 푸터 — 따뜻한 딥브라운 밴드로 "진짜 서비스" 신뢰감을 준다. */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[#5b4a3c] bg-[#3d3228] text-[#e7d9c6]">
      {/* 위쪽 톱니 같은 부드러운 곡선 대신, 크림 본문과 자연스럽게 이어지는 얇은 하이라이트 */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="mx-auto max-w-md px-6 py-12">
        {/* 브랜드 */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fbf3e9]/95 shadow-sm">
            <BowlIcon variant="general" className="h-8 w-8" />
          </span>
          <div>
            <p className="font-serif text-lg font-bold text-[#fbf3e9]">사주 한 입</p>
            <p className="text-xs text-[#b39f88]">복잡한 사주를, 한 입씩 가볍게.</p>
          </div>
        </div>

        {/* 따뜻한 한 마디 */}
        <p className="mt-6 text-xs leading-relaxed text-[#c7b6a0]">
          생일만 알려주면 AI가 명리학 기본 규칙으로 풀어드려요. 신비주의나 겁주기 없이,
          따뜻한 인사이트로요. 풀이는 오락·참고용이니 인생의 선택은 결국 당신의 몫이에요 🍚
        </p>

        {/* 링크 */}
        <div className="mt-9 grid grid-cols-2 gap-y-7 text-sm">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8f7d68]">둘러보기</p>
            <ul className="space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.key}>
                  <Link
                    href={`/check/${c.key}`}
                    className="text-[#d7c7b1] transition-colors hover:text-[#cbb6f0]"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8f7d68]">안내</p>
            <ul className="space-y-2">
              <li><Link href="/" className="text-[#d7c7b1] transition-colors hover:text-[#cbb6f0]">홈</Link></li>
              <li><Link href="/terms" className="text-[#d7c7b1] transition-colors hover:text-[#cbb6f0]">이용약관</Link></li>
              <li><Link href="/privacy" className="text-[#d7c7b1] transition-colors hover:text-[#cbb6f0]">개인정보처리방침</Link></li>
            </ul>
          </div>
        </div>

        {/* 하단 카피라이트 */}
        <div className="mt-11 border-t border-white/10 pt-6 text-[11px] leading-relaxed text-[#8f7d68]">
          <p>© 2026 사주 한 입. 풀이는 AI가 생성한 오락·참고용 콘텐츠입니다.</p>
          <p className="mt-1">회원가입 없이 이용하며, 입력한 생일 정보는 풀이 계산에만 쓰여요.</p>
        </div>
      </div>
    </footer>
  );
}
