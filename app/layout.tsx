import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:5173";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);

  return {
    metadataBase: base,
    title: "자격루트 | Q-Net 자격증 일정 관리",
    description: "한국산업인력공단 Q-Net 공공데이터로 국가기술자격 접수 기간과 시험일을 관리하세요.",
    openGraph: {
      title: "자격루트",
      description: "Q-Net 공식 자격증 일정, 놓치지 않게",
      images: [{ url: new URL("/og.png", base).toString(), width: 1734, height: 907 }],
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "자격루트",
      description: "Q-Net 공식 자격증 일정, 놓치지 않게",
      images: [new URL("/og.png", base).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
