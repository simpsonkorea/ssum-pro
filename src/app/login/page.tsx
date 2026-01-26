import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '로그인 - 읽씹당했나',
  description: '카카오톡 대화를 AI로 분석해보세요. 카카오 계정으로 3초만에 시작할 수 있습니다.',
  openGraph: {
    title: '로그인 - 읽씹당했나',
    description: '카카오톡 대화를 AI로 분석해보세요. 카카오 계정으로 3초만에 시작할 수 있습니다.',
    type: 'website',
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <span className="text-6xl">🔐</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              리포트를 받을 계정으로<br />
              로그인해주세요
            </h1>
            <p className="text-gray-500">
              분석 완료 시 카카오톡으로 알림을 보내드려요
            </p>
          </div>

          <a
            href="/api/auth/kakao"
            className="flex items-center justify-center gap-3 w-full bg-[#FEE500] text-[#191919] py-4 rounded-xl font-semibold text-lg hover:bg-[#FDD835] transition-colors shadow-md"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.82 1.88 5.29 4.69 6.71l-.95 3.57c-.08.3.22.55.49.39l4.14-2.76c.53.06 1.07.09 1.63.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
            </svg>
            카카오로 3초만에 시작하기
          </a>

          <p className="text-center text-sm text-gray-400 mt-4">
            로그인 시{' '}
            <Link href="/terms" className="underline hover:text-gray-600">
              서비스 이용약관
            </Link>
            에 동의하게 됩니다
          </p>
        </div>
      </div>

      <div className="py-6 border-t border-gray-100">
        <div className="flex justify-center gap-4 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">
            이용약관
          </Link>
          <span>|</span>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">
            개인정보처리방침
          </Link>
        </div>
      </div>
    </div>
  );
}
