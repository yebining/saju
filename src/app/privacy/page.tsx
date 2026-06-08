import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 — 사주 한 입",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-base font-bold text-fg">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-fg/85">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <p className="text-sm font-bold text-accent">사주 한 입</p>
      <h1 className="mt-1 text-2xl text-fg">개인정보처리방침</h1>
      <p className="mt-2 text-xs text-muted">최종 업데이트: 2026-06-07</p>

      <Section title="1. 수집하는 정보">
        <p>
          풀이 계산에 필요한 <b>생년월일·태어난 시각·성별·양력/음력 여부</b>만 입력받아요.
          이름·연락처·계정 같은 신원 정보는 받지 않습니다.
        </p>
      </Section>

      <Section title="2. 저장 위치와 보관">
        <p>
          입력한 &lsquo;내 사주&rsquo; 정보와 결과는 기본적으로 <b>이용자 브라우저(localStorage·sessionStorage)</b>에
          저장돼요. 서버에 회원 정보로 쌓이지 않습니다.
        </p>
        <p>
          서비스가 서버 저장(선택 기능)을 사용하는 경우, 같은 풀이를 다시 만들지 않으려고
          <b> 생일·카테고리로 만든 익명 키</b>와 그 풀이 결과만 저장해요. 이름 등 신원 정보는 포함하지 않습니다.
        </p>
      </Section>

      <Section title="3. 제3자 처리 (AI 풀이 생성)">
        <p>
          풀이 문장은 AI로 생성돼요. 이를 위해 입력한 사주 데이터(생일에서 계산한 사주 정보)가
          <b> AI 제공사(Google Gemini API)</b>로 전송되어 풀이 생성에 사용됩니다. 해당 처리는 각 제공사의
          정책을 따릅니다.
        </p>
      </Section>

      <Section title="4. 계정·광고">
        <p>회원가입·로그인이 없고, 추적용 광고 식별자도 사용하지 않아요.</p>
      </Section>

      <Section title="5. 삭제">
        <p>
          브라우저에 저장된 정보는 브라우저의 저장소 비우기로 언제든 삭제할 수 있어요.
          홈 화면의 &lsquo;내 사주 지우기&rsquo;로도 저장 정보를 지울 수 있습니다.
        </p>
      </Section>

      <Section title="6. 문의">
        <p>개인정보 관련 문의는 서비스 운영자에게 전달해 주세요. (문의 채널은 준비 중이에요.)</p>
      </Section>

      <Link href="/" className="mt-10 block text-center text-sm text-muted hover:text-accent">← 처음으로</Link>
    </main>
  );
}
