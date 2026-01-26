import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByPhone, createUser } from '@/lib/userStore';

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY!;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/kakao`;

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface KakaoUserResponse {
  id: number;
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    email?: string;
    name?: string;
    gender?: 'male' | 'female';
    birthyear?: string;
    phone_number?: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=no_code`);
  }

  try {
    // 1. 토큰 교환
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: REDIRECT_URI,
        code,
        ...(KAKAO_CLIENT_SECRET && { client_secret: KAKAO_CLIENT_SECRET }),
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokenData: KakaoTokenResponse = await tokenResponse.json();

    // 2. 사용자 정보 조회
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('User info fetch failed');
    }

    const userData: KakaoUserResponse = await userResponse.json();

    // 3. 전화번호 포맷 변환: +82 10-1234-5678 → 01012345678
    const rawPhone = userData.kakao_account?.phone_number;
    const phone = rawPhone
      ?.replace(/^\+82 /, '0')
      .replace(/-/g, '')
      .replace(/ /g, '');

    // 4. 전화번호로 기존 로컬 사용자 확인
    if (phone) {
      const existingUser = findUserByPhone(phone);
      if (existingUser && existingUser.provider === 'local') {
        console.log('[Kakao] Phone already registered with local account:', phone);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}?error=phone_exists_local&message=${encodeURIComponent('해당 전화번호로 가입한 계정이 있습니다. 일반 로그인을 이용해주세요.')}`
        );
      }
    }

    // 5. 사용자 정보 구성
    const kakaoUserId = String(userData.id);
    const userInfo = {
      id: kakaoUserId,
      name: userData.kakao_account?.name || userData.kakao_account?.profile?.nickname || '사용자',
      nickname: userData.kakao_account?.profile?.nickname,
      profileImage: userData.kakao_account?.profile?.profile_image_url,
      email: userData.kakao_account?.email,
      phone,
      gender: userData.kakao_account?.gender,
      birthyear: userData.kakao_account?.birthyear,
      provider: 'kakao' as const,
    };

    console.log('[Kakao] User info:', {
      id: userInfo.id,
      name: userInfo.name,
      hasPhone: !!userInfo.phone,
      gender: userInfo.gender,
      provider: userInfo.provider,
    });

    // 6. 사용자 저장/업데이트 (userStore에 카카오 사용자 등록)
    if (phone) {
      const existingKakaoUser = findUserByPhone(phone);
      if (!existingKakaoUser) {
        // 새로운 카카오 사용자 등록
        createUser({
          id: kakaoUserId,
          name: userInfo.name,
          phone,
          birthyear: userInfo.birthyear || '',
          gender: (userInfo.gender as 'male' | 'female') || 'male',
          provider: 'kakao',
          createdAt: new Date().toISOString(),
        });
        console.log('[Kakao] New user created in userStore');
      }
    }

    // 7. 세션 쿠키 설정
    const cookieStore = await cookies();
    cookieStore.set('user', JSON.stringify(userInfo), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // TODO: Supabase에 사용자 정보 저장/업데이트

    // Redirect with login success flag
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?login=success`);

  } catch (error) {
    console.error('Kakao auth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=auth_error`);
  }
}
