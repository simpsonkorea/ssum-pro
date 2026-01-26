import { NextRequest, NextResponse } from 'next/server';
import { verifyCode, VerificationPurpose } from '@/lib/smsStore';

interface VerifyCodeRequest {
  phone: string;
  code: string;
  purpose: VerificationPurpose;
}

/**
 * Validate phone format (01012345678)
 */
function validatePhone(phone: string): { valid: boolean; normalized: string; error?: string } {
  // Remove hyphens and spaces
  const normalized = phone.replace(/[-\s]/g, '');

  // Check format: 010XXXXXXXX (11 digits starting with 010)
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
 * POST /api/auth/verify-code
 * Body: { phone: string, code: string, purpose: 'signup' | 'reset' }
 *
 * Validation:
 * 1. Check code exists and not expired
 * 2. Check attempts < 5
 * 3. Verify code matches
 *
 * On success: return verification token (random string)
 * Response: { success: true, verificationToken: string } or error
 */
export async function POST(request: NextRequest) {
  try {
    const body: VerifyCodeRequest = await request.json();
    const { phone, code, purpose } = body;

    // 1. Required fields check
    if (!phone || !code || !purpose) {
      return NextResponse.json(
        { error: '전화번호, 인증번호, 인증 목적을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 2. Validate purpose
    if (purpose !== 'signup' && purpose !== 'reset') {
      return NextResponse.json(
        { error: '올바른 인증 목적이 아닙니다.' },
        { status: 400 }
      );
    }

    // 3. Validate phone format
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error },
        { status: 400 }
      );
    }
    const normalizedPhone = phoneValidation.normalized;

    // 4. Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: '6자리 인증번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 5. Verify code (handles expiry, attempts, and matching)
    const result = verifyCode(normalizedPhone, purpose, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log(`[Verify Code] Phone ${normalizedPhone} verified for ${purpose}`);

    return NextResponse.json({
      success: true,
      verificationToken: result.verificationToken,
      message: '인증이 완료되었습니다.',
    });

  } catch (error) {
    console.error('[Verify Code] Error:', error);
    return NextResponse.json(
      { error: '인증 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
