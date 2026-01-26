import { NextRequest, NextResponse } from 'next/server';
import { findUserByPhone } from '@/lib/userStore';
import {
  canSendCode,
  createVerificationCode,
  VerificationPurpose,
} from '@/lib/smsStore';
import { sendVerificationSMS } from '@/lib/solapi';

interface SendCodeRequest {
  phone: string;
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
      error: '올바른 전화번호 형식이 아닙니다. (예: 01012345678)',
    };
  }

  return { valid: true, normalized };
}

/**
 * POST /api/auth/send-code
 * Body: { phone: string, purpose: 'signup' | 'reset' }
 *
 * Validation:
 * 1. Check phone format (01012345678)
 * 2. For signup: check phone not already registered
 * 3. For reset: check phone IS registered
 * 4. Check daily limit (5/day)
 * 5. Check cooldown (30 seconds)
 *
 * Generate code, store it, send SMS
 * Response: { success: true, expiresAt: timestamp } or error
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendCodeRequest = await request.json();
    const { phone, purpose } = body;

    // 1. Required fields check
    if (!phone || !purpose) {
      return NextResponse.json(
        { error: '전화번호와 인증 목적을 입력해주세요.' },
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

    // 4. Check phone registration status based on purpose
    const existingUser = findUserByPhone(normalizedPhone);

    if (purpose === 'signup') {
      // For signup: phone should NOT be registered
      if (existingUser) {
        if (existingUser.provider === 'kakao') {
          return NextResponse.json(
            { error: '카카오로 가입된 계정입니다. 카카오 로그인을 이용해주세요.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: '이미 가입된 전화번호입니다. 로그인을 이용해주세요.' },
          { status: 409 }
        );
      }
    } else if (purpose === 'reset') {
      // For reset: phone should BE registered
      if (!existingUser) {
        return NextResponse.json(
          { error: '등록되지 않은 전화번호입니다.' },
          { status: 404 }
        );
      }

      if (existingUser.provider === 'kakao') {
        return NextResponse.json(
          { error: '카카오로 가입된 계정입니다. 카카오 로그인을 이용해주세요.' },
          { status: 409 }
        );
      }
    }

    // 5. Check rate limits (daily limit + cooldown)
    const rateCheck = canSendCode(normalizedPhone, purpose);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: rateCheck.error,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 6. Generate code and store it
    const code = createVerificationCode(normalizedPhone, purpose);
    const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes from now

    // 7. Send SMS
    const smsSent = await sendVerificationSMS(normalizedPhone, code);
    if (!smsSent) {
      return NextResponse.json(
        { error: 'SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    console.log(`[Send Code] Code sent to ${normalizedPhone} for ${purpose}`);

    return NextResponse.json({
      success: true,
      expiresAt,
      message: '인증번호가 발송되었습니다. 3분 내에 입력해주세요.',
    });

  } catch (error) {
    console.error('[Send Code] Error:', error);
    return NextResponse.json(
      { error: '인증번호 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
