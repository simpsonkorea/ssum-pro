import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { findUserByPhone, createUser } from '@/lib/userStore';
import { isVerificationTokenValid, consumeVerificationToken } from '@/lib/smsStore';

interface SignupRequest {
  name: string;
  phone: string;
  birthyear: string;
  gender: 'male' | 'female';
  password: string;
  verificationToken: string;
}

// Validation functions
function validatePhone(phone: string): { valid: boolean; normalized: string; error?: string } {
  // Remove hyphens and spaces
  const normalized = phone.replace(/[-\s]/g, '');

  // Check format: 010XXXXXXXX (11 digits starting with 010)
  if (!/^010\d{8}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: '올바른 전화번호 형식이 아닙니다. (예: 01012345678)',
    };
  }

  return { valid: true, normalized };
}

function validateBirthyear(birthyear: string): { valid: boolean; error?: string } {
  const year = parseInt(birthyear, 10);

  if (isNaN(year) || !/^\d{4}$/.test(birthyear)) {
    return { valid: false, error: '출생연도는 4자리 숫자여야 합니다.' };
  }

  if (year < 1900 || year > 2025) {
    return { valid: false, error: '출생연도는 1900년에서 2025년 사이여야 합니다.' };
  }

  return { valid: true };
}

function validateGender(gender: string): { valid: boolean; error?: string } {
  if (gender !== 'male' && gender !== 'female') {
    return { valid: false, error: '성별은 male 또는 female 이어야 합니다.' };
  }
  return { valid: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: '비밀번호에 소문자가 포함되어야 합니다.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: '비밀번호에 대문자가 포함되어야 합니다.' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '비밀번호에 숫자가 포함되어야 합니다.' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: '비밀번호에 특수문자가 포함되어야 합니다.' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { name, phone, birthyear, gender, password, verificationToken } = body;

    // 1. Required fields check
    if (!name || !phone || !birthyear || !gender || !password || !verificationToken) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 2. Validate phone
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }
    const normalizedPhone = phoneValidation.normalized;

    // 2.5 Validate verification token
    if (!isVerificationTokenValid(verificationToken, normalizedPhone, 'signup')) {
      return NextResponse.json(
        { error: '전화번호 인증이 유효하지 않습니다. 다시 인증해주세요.' },
        { status: 400 }
      );
    }

    // 3. Validate birthyear
    const birthyearValidation = validateBirthyear(birthyear);
    if (!birthyearValidation.valid) {
      return NextResponse.json(
        { error: birthyearValidation.error },
        { status: 400 }
      );
    }

    // 4. Validate gender
    const genderValidation = validateGender(gender);
    if (!genderValidation.valid) {
      return NextResponse.json(
        { error: genderValidation.error },
        { status: 400 }
      );
    }

    // 5. Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // 6. Check if phone already exists
    const existingUser = findUserByPhone(normalizedPhone);
    if (existingUser) {
      if (existingUser.provider === 'kakao') {
        return NextResponse.json(
          { error: '카카오로 가입된 계정입니다. 카카오 로그인을 이용해주세요.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: '이미 가입된 전화번호입니다.' },
        { status: 409 }
      );
    }

    // 7. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 8. Create user
    const userId = nanoid();
    const newUser = createUser({
      id: userId,
      name,
      phone: normalizedPhone,
      birthyear,
      gender: gender as 'male' | 'female',
      provider: 'local',
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    // Consume (invalidate) the verification token after successful signup
    consumeVerificationToken(verificationToken);

    console.log('[Signup] User created:', {
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      provider: newUser.provider,
    });

    // 9. Set session cookie (same structure as Kakao)
    const cookieStore = await cookies();
    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      birthyear: newUser.birthyear,
      gender: newUser.gender,
      provider: newUser.provider,
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
    console.error('[Signup] Error:', error);
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
