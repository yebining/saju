import type { Metadata } from "next";
import { Noto_Serif_KR, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif_KR({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-serif" });
const notoSans = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "관계 사주 — 시작해도 될까",
  description: "썸/연인 시작 전, 결정에 도움 받는 사주 풀이",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSerif.variable} ${notoSans.variable}`}>
      <body className="font-sans bg-bg text-fg min-h-screen">{children}</body>
    </html>
  );
}
