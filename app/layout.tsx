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
    title: "자격루트 | 자격증 일정 관리",
    description: "접수 기간부터 시험일까지, 취업 준비에 필요한 자격증 일정을 한곳에서 관리하세요.",
    openGraph: {
      title: "자격루트",
      description: "자격증 일정, 놓치지 않게",
      images: [{ url: new URL("/og.png", base).toString(), width: 1734, height: 907 }],
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "자격루트",
      description: "자격증 일정, 놓치지 않게",
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
