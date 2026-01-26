import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeTossAuthCode, getTossUserInfo } from '@/lib/toss';

// Toss OAuth: Authorization Code → Token → User Info
export async function POST(request: NextRequest) {
  try {
    const { authorizationCode, referrer } = await request.json();

    if (!authorizationCode) {
      return NextResponse.json(
        { error: '인증 코드가 필요해요' },
        { status: 400 }
      );
    }

    // 1. Authorization Code → Access Token
    const tokenResult = await exchangeTossAuthCode(
      authorizationCode,
      referrer || 'DEFAULT'
    );

    if (!tokenResult.success) {
      return NextResponse.json(
        { error: '토스 인증에 실패했어요' },
        { status: 401 }
      );
    }

    // 2. Access Token → User Info
    const userInfo = await getTossUserInfo(tokenResult.accessToken);

    if (!userInfo.success) {
      return NextResponse.json(
        { error: '사용자 정보를 가져올 수 없어요' },
        { status: 401 }
      );
    }

    // 3. 세션 저장 (쿠키)
    const cookieStore = await cookies();
    const sessionData = {
      userKey: userInfo.userKey,
      name: userInfo.name,
      phone: userInfo.phone,
      platform: 'toss',
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
    };

    cookieStore.set('toss_user', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14, // 14일 (refresh token 유효기간)
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userInfo.userKey,
        name: userInfo.name,
        phone: userInfo.phone,
      },
    });

  } catch (error) {
    console.error('Toss auth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '인증 중 오류가 발생했어요' },
      { status: 500 }
    );
  }
}

// 현재 세션 확인
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('toss_user');

    if (!userCookie) {
      return NextResponse.json(
        { error: '로그인이 필요해요' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userCookie.value);

    return NextResponse.json({
      success: true,
      user: {
        id: user.userKey,
        name: user.name,
        phone: user.phone,
        platform: user.platform,
      },
    });

  } catch (error) {
    console.error('Toss session error:', error);
    return NextResponse.json(
      { error: '세션 확인 중 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
