import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "읽씹당했나 - AI 썸 분석기",
  description: "카톡 대화를 AI가 분석하여 상대방의 진심을 알려드립니다. 심리학 + 코칭 프레임워크 기반.",
  keywords: ["썸", "연애", "카톡 분석", "AI 연애 상담", "호감도 테스트", "읽씹"],
  authors: [{ name: "읽씹당했나" }],
  openGraph: {
    title: "읽씹당했나 - AI 썸 분석기",
    description: "카톡 대화를 AI가 분석하여 상대방의 진심을 알려드립니다.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "읽씹당했나 - AI 썸 분석기",
    description: "카톡 대화를 AI가 분석하여 상대방의 진심을 알려드립니다.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ec4899",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
