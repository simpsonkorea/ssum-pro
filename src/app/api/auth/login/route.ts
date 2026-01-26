import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { findUserByPhone } from '@/lib/userStore';

interface LoginRequest {
  phone: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { phone, password } = body;

    // 1. Required fields check
    if (!phone || !password) {
      return NextResponse.json(
        { error: '전화번호와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 2. Normalize phone (remove hyphens and spaces)
    const normalizedPhone = phone.replace(/[-\s]/g, '');

    // 3. Find user by phone
    const user = findUserByPhone(normalizedPhone);
    if (!user) {
      return NextResponse.json(
        { error: '등록되지 않은 전화번호입니다.' },
        { status: 401 }
      );
    }

    // 4. Check if user is a Kakao user
    if (user.provider === 'kakao') {
      return NextResponse.json(
        { error: '카카오로 가입된 계정입니다. 카카오 로그인을 이용해주세요.' },
        { status: 403 }
      );
    }

    // 5. Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: '계정에 비밀번호가 설정되어 있지 않습니다.' },
        { status: 500 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    console.log('[Login] User authenticated:', {
      id: user.id,
      name: user.name,
      phone: user.phone,
      provider: user.provider,
    });

    // 6. Set session cookie (same structure as Kakao)
    const cookieStore = await cookies();
    const sessionUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      birthyear: user.birthyear,
      gender: user.gender,
      provider: user.provider,
    };

    cookieStore.set('user', JSON.stringify(sessionUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });

  } catch (error) {
    console.error('[Login] Error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
