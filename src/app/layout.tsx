import type { Metadata } from "next";
import { Noto_Serif_KR, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";

const notoSerif = Noto_Serif_KR({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-serif" });
const notoSans = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "사주 한 입 — 오늘의 나를 풀어보다",
  description: "생일만 알려주면 AI가 종합·연애·재물·건강운과 궁합까지 따뜻하게 풀어드려요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSerif.variable} ${notoSans.variable}`}>
      <body className="font-sans bg-bg text-fg min-h-screen">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
