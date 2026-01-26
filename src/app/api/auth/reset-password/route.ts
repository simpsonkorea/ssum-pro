import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByPhone, updateUser } from '@/lib/userStore';
import { isVerificationTokenValid, consumeVerificationToken } from '@/lib/smsStore';

interface ResetPasswordRequest {
  phone: string;
  verificationToken: string;
  newPassword: string;
}

/**
 * Validate phone format (01012345678)
 */
function validatePhone(phone: string): { valid: boolean; normalized: string; error?: string } {
  const normalized = phone.replace(/[-\s]/g, '');

  if (!/^010\d{8}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: '올바른 전화번호 형식이 아닙니다.',
    };
  }

  return { valid: true, normalized };
}

/**
 * Validate password strength
 */
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

/**
 * POST /api/auth/reset-password
 * Body: { phone: string, verificationToken: string, newPassword: string }
 *
 * Validation:
 * 1. Check verificationToken is valid for this phone
 * 2. Validate new password (same rules as signup)
 * 3. Find user by phone
 * 4. Hash new password with bcrypt
 * 5. Update user's passwordHash in userStore
 *
 * Response: { success: true } or error
 */
export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json();
    const { phone, verificationToken, newPassword } = body;

    // 1. Validate required fields
    if (!phone || !verificationToken || !newPassword) {
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

    // 3. Validate verification token
    if (!(await isVerificationTokenValid(verificationToken, normalizedPhone, 'reset'))) {
      return NextResponse.json(
        { error: '인증이 만료되었습니다. 다시 인증해주세요.' },
        { status: 401 }
      );
    }

    // 4. Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // 5. Find user by phone
    const user = findUserByPhone(normalizedPhone);
    if (!user) {
      return NextResponse.json(
        { error: '등록되지 않은 전화번호입니다.' },
        { status: 404 }
      );
    }

    // 6. Check if user is a Kakao user
    if (user.provider === 'kakao') {
      return NextResponse.json(
        { error: '카카오로 가입된 계정입니다. 카카오 로그인을 이용해주세요.' },
        { status: 400 }
      );
    }

    // 7. Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // 8. Update user's password
    const updatedUser = updateUser(user.id, { passwordHash });

    if (!updatedUser) {
      return NextResponse.json(
        { error: '비밀번호 변경 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 9. Consume the verification token (single use)
    await consumeVerificationToken(verificationToken);

    console.log('[Reset Password] Password updated for user:', {
      id: user.id,
      phone: normalizedPhone,
    });

    return NextResponse.json({
      success: true,
      message: '비밀번호가 변경되었습니다.',
    });

  } catch (error) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
