import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "읽씹당했나 - 카톡 대화 AI 분석으로 상대방 마음 확인하기",
  description: "카카오톡 대화를 AI가 분석해 호감도 점수와 공략법을 알려드립니다. 심리학 기반 무료 테스트로 5분 안에 확인하세요.",
  keywords: ["썸", "연애", "카톡 분석", "AI 연애 상담", "호감도 테스트", "읽씹", "읽씹 뜻", "카톡 분석", "호감도 테스트", "썸남 심리", "썸녀 심리"],
  authors: [{ name: "읽씹당했나" }],
  openGraph: {
    title: "읽씹당했나 - 카톡 대화 AI 분석으로 상대방 마음 확인하기",
    description: "카카오톡 대화를 AI가 분석해 호감도 점수와 공략법을 알려드립니다. 심리학 기반 무료 테스트로 5분 안에 확인하세요.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "읽씹당했나 - 카톡 대화 AI 분석으로 상대방 마음 확인하기",
    description: "카카오톡 대화를 AI가 분석해 호감도 점수와 공략법을 알려드립니다. 심리학 기반 무료 테스트로 5분 안에 확인하세요.",
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
