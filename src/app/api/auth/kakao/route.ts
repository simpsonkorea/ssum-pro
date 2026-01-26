import { NextResponse } from 'next/server';

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/kakao`;

export async function GET() {
  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
  kakaoAuthUrl.searchParams.set('client_id', KAKAO_REST_API_KEY);
  kakaoAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  kakaoAuthUrl.searchParams.set('response_type', 'code');
  // 카카오싱크 scope (비즈니스 인증 필요)
  kakaoAuthUrl.searchParams.set(
    'scope',
    'profile_nickname,profile_image,account_email,name,gender,birthyear,phone_number'
  );

  return NextResponse.redirect(kakaoAuthUrl.toString());
}
