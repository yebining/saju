import Link from "next/link";

export const metadata = {
  title: "이용약관 — 사주 한 입",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-base font-bold text-fg">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-fg/85">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <p className="text-sm font-bold text-accent">사주 한 입</p>
      <h1 className="mt-1 text-2xl text-fg">이용약관</h1>
      <p className="mt-2 text-xs text-muted">최종 업데이트: 2026-06-07</p>

      <Section title="1. 서비스 소개">
        <p>
          &lsquo;사주 한 입&rsquo;은 생년월일·태어난 시각 등을 바탕으로 AI가 명리학 기본 규칙으로
          풀이를 생성해 보여주는 서비스예요. 종합·연애·재물·건강운과 관계 궁합을 다룹니다.
        </p>
      </Section>

      <Section title="2. 오락·참고용 안내 (면책)">
        <p>
          모든 풀이는 <b>오락·참고 목적</b>이에요. 의료·법률·재무·진로 등 중요한 결정의 근거로
          삼지 마세요. 풀이로 인한 선택과 결과의 책임은 이용자 본인에게 있습니다.
        </p>
        <p>AI가 생성하는 특성상 표현이 매번 조금씩 다를 수 있어요.</p>
      </Section>

      <Section title="3. 이용 방법">
        <p>회원가입 없이 누구나 무료로 이용할 수 있어요. 별도의 계정이나 결제가 없습니다.</p>
      </Section>

      <Section title="4. 콘텐츠">
        <p>
          화면에 보이는 풀이는 AI가 생성한 콘텐츠예요. 개인적으로 즐기는 용도로 자유롭게 보시되,
          서비스 화면·디자인의 무단 복제·상업적 이용은 삼가주세요.
        </p>
      </Section>

      <Section title="5. 약관 변경">
        <p>서비스 개선에 따라 본 약관은 변경될 수 있으며, 변경 시 이 페이지에 반영됩니다.</p>
      </Section>

      <Link href="/" className="mt-10 block text-center text-sm text-muted hover:text-accent">← 처음으로</Link>
    </main>
  );
}
