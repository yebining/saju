import type { Metadata } from "next";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";

// 레트로 점집 모던: 임팩트 있는 디스플레이(헤딩) + 깔끔한 본문
const blackHanSans = Black_Han_Sans({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const notoSans = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "사주 한 입 — 오늘의 나를 풀어보다",
  description: "생일만 알려주면 AI가 종합·연애·재물·건강운과 궁합까지 따뜻하게 풀어드려요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${blackHanSans.variable} ${notoSans.variable}`}>
      <body className="font-sans bg-bg text-fg min-h-screen">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
