// Solapi SMS/LMS 발송
import crypto from 'crypto';

const SOLAPI_API_KEY = (process.env.SOLAPI_API_KEY || '').trim();
const SOLAPI_API_SECRET = (process.env.SOLAPI_API_SECRET || '').trim();
const SENDER_PHONE = (process.env.SOLAPI_SENDER_PHONE || '01012345678').trim();

function generateSignature() {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', SOLAPI_API_SECRET)
    .update(date + salt)
    .digest('hex');

  return {
    Authorization: `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
  };
}

interface SendMessageParams {
  to: string;
  text: string;
  subject?: string; // LMS용 제목
}

export async function sendLMS({ to, text, subject }: SendMessageParams) {
  // 전화번호 포맷 정리 (하이픈 제거)
  const cleanPhone = to.replace(/-/g, '');

  if (!SOLAPI_API_SECRET) {
    console.log(`[LMS 테스트] To: ${cleanPhone}, Subject: ${subject}, Message: ${text}`);
    return { success: true, test: true };
  }

  try {
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        ...generateSignature(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: cleanPhone,
          from: SENDER_PHONE,
          type: 'LMS',
          subject: subject || '읽씹당했나',
          text,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Solapi LMS error:', result);
      throw new Error(result.message || 'LMS 발송 실패');
    }

    console.log('LMS sent successfully:', result);
    return { success: true, result };

  } catch (error) {
    console.error('LMS send error:', error);
    throw error;
  }
}

export async function sendSMS({ to, text }: SendMessageParams) {
  const cleanPhone = to.replace(/-/g, '');

  if (!SOLAPI_API_SECRET) {
    console.log(`[SMS 테스트] To: ${cleanPhone}, Message: ${text}`);
    return { success: true, test: true };
  }

  try {
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        ...generateSignature(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: cleanPhone,
          from: SENDER_PHONE,
          type: 'SMS',
          text,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Solapi SMS error:', result);
      throw new Error(result.message || 'SMS 발송 실패');
    }

    return { success: true, result };

  } catch (error) {
    console.error('SMS send error:', error);
    throw error;
  }
}

export async function sendReportNotification(
  phone: string,
  userName: string,
  reportId: string,
  appUrl: string
) {
  const message = `[읽씹당했나] ${userName}님의 썸 분석 완료!

▶ 리포트 보기
${appUrl}/report/${reportId}

AI 연애 코치 100회 상담 포함`;

  return sendLMS({
    to: phone,
    text: message,
    subject: '💘 썸 분석 완료',
  });
}

/**
 * Send verification SMS for auth purposes
 * Includes Web OTP API format for auto-fill on mobile
 */
export async function sendVerificationSMS(phone: string, code: string): Promise<boolean> {
  // Web OTP API requires: @origin #code at the end
  const message = `[읽씹당했나] 인증번호: ${code}\n3분 내에 입력해주세요.\n\n@ssum-pro.vercel.app #${code}`;

  try {
    const result = await sendSMS({
      to: phone,
      text: message,
    });

    return result.success === true;
  } catch (error) {
    console.error('[Solapi] Failed to send verification SMS:', error);
    return false;
  }
}
