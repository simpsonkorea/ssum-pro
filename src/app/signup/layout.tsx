import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입 - 읽씹당했나',
  description: '휴대폰 번호로 간편하게 가입하세요. AI 카카오톡 대화 분석 서비스',
  openGraph: {
    title: '회원가입 - 읽씹당했나',
    description: '휴대폰 번호로 간편하게 가입하세요. AI 카카오톡 대화 분석 서비스',
    type: 'website',
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
