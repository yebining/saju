import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// 사업자 정보 — ⚠️ 데모용 더미값입니다(대표명만 실제). 실제 운영 시 교체하세요.
// (통신판매업신고번호·사업자등록번호는 실제 신고/등록 후 기재해야 합니다.)
// ─────────────────────────────────────────────────────────────
const BIZ = {
  brand: "사주 한 입",
  ceo: "김예빈",
  address: "서울특별시 강남구 테헤란로 00, 0층",
  bizNo: "123-45-67890",
  salesNo: "제2026-서울강남-0000호",
  email: "help@sajuhanip.kr",
  hours: "평일 10:00 ~ 19:00",
};

function Sep() {
  return <span className="mx-2 text-border">|</span>;
}

/** 사이트 공통 푸터 — eunha-saju 스타일의 라이트·중앙정렬 공식 정보 블록. */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card/50">
      <div className="mx-auto max-w-md px-6 py-10 text-center">
        <p className="font-serif text-base font-bold text-fg/75">{BIZ.brand}</p>

        <nav className="mt-4 flex items-center justify-center text-xs font-bold text-fg/70">
          <Link href="/terms" className="transition-colors hover:text-accent">이용약관</Link>
          <Sep />
          <Link href="/privacy" className="transition-colors hover:text-accent">개인정보처리방침</Link>
        </nav>

        <div className="mx-auto mt-5 max-w-xs space-y-1 text-[11px] leading-relaxed text-muted">
          <p>상호 {BIZ.brand}<Sep />대표 {BIZ.ceo}</p>
          <p>{BIZ.address}</p>
          <p>사업자등록번호 {BIZ.bizNo}</p>
          <p>통신판매업신고번호 {BIZ.salesNo}</p>
          <p>고객센터 {BIZ.email}<Sep />{BIZ.hours}</p>
        </div>

        <p className="mx-auto mt-5 max-w-xs text-[11px] leading-relaxed text-muted/80">
          본 서비스의 풀이는 AI가 생성한 오락·참고용 콘텐츠이며, 전문적인 조언을 대신하지 않습니다.
        </p>
        <p className="mt-1.5 text-[11px] text-muted/70">© 2026 {BIZ.brand}. All rights reserved.</p>
      </div>
    </footer>
  );
}
