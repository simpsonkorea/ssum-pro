// Toss App-in-Toss API utilities
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';

const TOSS_API_BASE = 'https://apps-in-toss-api.toss.im';

// mTLS 설정 (환경변수로 인증서 경로 지정)
function getMtlsAgent() {
  const certPath = process.env.TOSS_MTLS_CERT_PATH;
  const keyPath = process.env.TOSS_MTLS_KEY_PATH;

  if (!certPath || !keyPath) {
    console.warn('[Toss] mTLS 인증서 경로 미설정 - 테스트 모드');
    return undefined;
  }

  return new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  });
}

// AES-256-GCM 복호화 (Toss 개인정보)
export function decryptTossPersonalInfo(
  encryptedText: string,
  base64AesKey?: string,
  aadString?: string
): string {
  const key = base64AesKey || process.env.TOSS_DECRYPTION_KEY!;
  const aad = aadString || process.env.TOSS_AAD_STRING!;

  if (!key || !aad) {
    console.warn('[Toss] 복호화 키 미설정 - 원본 반환');
    return encryptedText;
  }

  const IV_LENGTH = 12;
  const TAG_LENGTH = 16;

  const decoded = Buffer.from(encryptedText, 'base64');
  const iv = decoded.subarray(0, IV_LENGTH);
  const authTag = decoded.subarray(-TAG_LENGTH);
  const ciphertext = decoded.subarray(IV_LENGTH, decoded.length - TAG_LENGTH);

  const keyBuffer = Buffer.from(key, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(aad, 'utf8'));

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

// Toss OAuth: Authorization Code → Access Token
export async function exchangeTossAuthCode(
  authorizationCode: string,
  referrer: 'DEFAULT' | 'SANDBOX' = 'DEFAULT'
) {
  const mtlsAgent = getMtlsAgent();

  // 테스트 모드
  if (!mtlsAgent) {
    console.log(`[Toss Auth Test] Code: ${authorizationCode}, Referrer: ${referrer}`);
    return {
      success: true,
      test: true,
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token',
      expiresIn: 3599,
    };
  }

  const response = await fetch(
    `${TOSS_API_BASE}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizationCode, referrer }),
      // @ts-expect-error - Node.js fetch agent support
      agent: mtlsAgent,
    }
  );

  const result = await response.json();

  if (result.resultType !== 'SUCCESS') {
    throw new Error(result.message || 'Toss 토큰 발급 실패');
  }

  return {
    success: true,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
    scope: result.scope,
  };
}

// Toss OAuth: Access Token → User Info
export async function getTossUserInfo(accessToken: string) {
  const mtlsAgent = getMtlsAgent();

  // 테스트 모드
  if (!mtlsAgent) {
    console.log(`[Toss User Test] Token: ${accessToken.substring(0, 20)}...`);
    return {
      success: true,
      test: true,
      userKey: 'test_user_12345',
      name: '테스트유저',
      phone: '01012345678',
    };
  }

  const response = await fetch(
    `${TOSS_API_BASE}/api-partner/v1/apps-in-toss/user/oauth2/login-me`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      // @ts-expect-error - Node.js fetch agent support
      agent: mtlsAgent,
    }
  );

  const result = await response.json();

  if (result.resultType !== 'SUCCESS') {
    throw new Error(result.message || 'Toss 유저 정보 조회 실패');
  }

  // 암호화된 개인정보 복호화
  return {
    success: true,
    userKey: result.userKey,
    name: decryptTossPersonalInfo(result.name),
    phone: decryptTossPersonalInfo(result.phone),
    birthday: result.birthday ? decryptTossPersonalInfo(result.birthday) : undefined,
    gender: result.gender ? decryptTossPersonalInfo(result.gender) : undefined,
  };
}

// Toss IAP: 주문 상태 확인
export async function verifyTossIapOrder(orderId: string, userKey: string) {
  const mtlsAgent = getMtlsAgent();

  // 테스트 모드
  if (!mtlsAgent) {
    console.log(`[Toss IAP Test] Order: ${orderId}, User: ${userKey}`);
    return {
      success: true,
      test: true,
      orderId,
      status: 'PURCHASED',
      sku: 'ssum_analysis_report',
    };
  }

  const response = await fetch(
    `${TOSS_API_BASE}/api-partner/v1/apps-in-toss/order/get-order-status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-toss-user-key': userKey,
      },
      body: JSON.stringify({ orderId }),
      // @ts-expect-error - Node.js fetch agent support
      agent: mtlsAgent,
    }
  );

  const result = await response.json();

  return {
    success: result.status === 'PURCHASED' || result.status === 'PAYMENT_COMPLETED',
    orderId: result.orderId,
    status: result.status,
    sku: result.sku,
    reason: result.reason,
  };
}

// Toss sendMessage: 알림 발송
export async function sendTossNotification(
  userKey: string,
  templateSetCode: string,
  context: Record<string, string>
) {
  const mtlsAgent = getMtlsAgent();

  // 테스트 모드
  if (!mtlsAgent) {
    console.log(`[Toss Notification Test] User: ${userKey}, Template: ${templateSetCode}`);
    console.log(`[Toss Notification Test] Context:`, context);
    return {
      success: true,
      test: true,
      sentPushCount: 1,
      sentInboxCount: 1,
    };
  }

  const response = await fetch(
    `${TOSS_API_BASE}/api-partner/v1/apps-in-toss/messenger/send-message`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-toss-user-key': userKey,
      },
      body: JSON.stringify({ templateSetCode, context }),
      // @ts-expect-error - Node.js fetch agent support
      agent: mtlsAgent,
    }
  );

  const result = await response.json();

  if (result.resultType !== 'SUCCESS') {
    throw new Error(result.reachFailReason || 'Toss 알림 발송 실패');
  }

  return {
    success: true,
    sentPushCount: result.sentPushCount,
    sentInboxCount: result.sentInboxCount,
    sentSmsCount: result.sentSmsCount,
    sentAlimtalkCount: result.sentAlimtalkCount,
  };
}

// 분석 완료 알림 발송 (템플릿 사용)
export async function sendAnalysisCompleteNotification(
  userKey: string,
  userName: string,
  reportId: string,
  appDeepLink: string
) {
  // 템플릿 코드는 Toss 콘솔에서 승인받은 후 사용
  const templateSetCode = process.env.TOSS_NOTIFICATION_TEMPLATE || 'chat_decoder_analysis_complete';

  return sendTossNotification(userKey, templateSetCode, {
    userName,
    reportId,
    reportLink: appDeepLink,
    analysisDate: new Date().toLocaleDateString('ko-KR'),
  });
}
