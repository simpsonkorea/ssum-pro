import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 - 읽씹당했나',
  description: '휴대폰 번호로 로그인하세요. AI 카카오톡 대화 분석 서비스',
  openGraph: {
    title: '로그인 - 읽씹당했나',
    description: '휴대폰 번호로 로그인하세요. AI 카카오톡 대화 분석 서비스',
    type: 'website',
  },
};

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
