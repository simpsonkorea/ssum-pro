# Web to Apps-in-Toss Migration Guide

웹 서비스를 토스 앱인토스로 마이그레이션하는 프로세스 문서.

## Quick Start (검토 완료 후 체크리스트)

### 필요한 환경변수 (Toss 콘솔에서 발급)

```bash
# .env.local에 추가

# 1. mTLS 인증서 (✅ 발급완료)
TOSS_MTLS_CERT_PATH=/path/to/카톡썸인증서_public.crt
TOSS_MTLS_KEY_PATH=/path/to/카톡썸인증서_private.key

# 2. 복호화 키 (⏳ 토스 로그인 등록 후 발급)
TOSS_DECRYPTION_KEY={Base64_encoded_AES_key}
TOSS_AAD_STRING={AAD_string}

# 3. 알림 템플릿 (⏳ 등록 후 코드 입력)
TOSS_NOTIFICATION_TEMPLATE=chat_decoder_analysis_complete
```

### Toss 콘솔 작업 순서

| 순서 | 작업 | 메뉴 위치 | 상태 |
|------|------|-----------|------|
| 1 | 사업자 정보 검토 | 자동 | ⏳ 검토중 (약 1일) |
| 2 | mTLS 인증서 발급 | 개발 > mTLS 인증서 | ✅ 완료 |
| 3 | 토스 로그인 등록 | 개발 > 토스 로그인 | ⏳ 검토 후 |
| 4 | 복호화 키 발급 | 토스 로그인 > 암복호화 키 | ⏳ 로그인 등록 후 |
| 5 | IAP 상품 등록 | 개발 > IAP | ⏳ 검토 후 |
| 6 | 알림 템플릿 등록 | 개발 > 푸시/알림 | ⏳ 검토 후 |

---

## Architecture Overview

### Web vs Apps-in-Toss 비교

| 기능 | Web 버전 | Apps-in-Toss 버전 |
|------|----------|-------------------|
| 인증 | Kakao OAuth | `appLogin()` |
| 결제 | TossPayments SDK | `IAP.createOneTimePurchaseOrder()` |
| 알림 | Solapi SMS/알림톡 | `sendMessage` API |
| 저장소 | localStorage | Toss Storage API |
| 전화번호 | 수동 입력 | 자동 획득 (로그인 시) |

### 토스 API 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (web/index.html)                                        │
├─────────────────────────────────────────────────────────────────┤
│  appLogin() → authorizationCode                                 │
│       ↓                                                         │
│  POST /api/auth/toss/callback                                   │
│       ↓                                                         │
│  Server: mTLS로 Toss API 호출                                   │
│    - /generate-token → accessToken                              │
│    - /login-me → 암호화된 개인정보                               │
│    - 복호화 (DECRYPTION_KEY + AAD)                              │
│       ↓                                                         │
│  User: { id, name, phone }                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Migration Process (반복 가능한 프로세스)

### Phase 1: 코드 준비

#### 1.1 브랜딩 변경
```bash
# 검색 및 치환 대상 파일
src/app/layout.tsx      # 메타데이터
src/app/page.tsx        # 랜딩 페이지
src/lib/gemini.ts       # AI 프롬프트
src/lib/solapi.ts       # SMS 발신자명
```

#### 1.2 Toss 라이브러리 추가
```typescript
// src/lib/toss.ts 생성
// - decryptTossPersonalInfo(): AES-256-GCM 복호화
// - exchangeTossAuthCode(): OAuth 토큰 교환
// - getTossUserInfo(): 사용자 정보 조회
// - verifyTossIapOrder(): IAP 검증
// - sendTossNotification(): 알림 발송
```

#### 1.3 API 엔드포인트 추가
```
src/app/api/auth/toss/callback/route.ts   # OAuth 콜백
src/app/api/payment/toss-iap/route.ts     # IAP 검증
src/app/api/notify/toss/route.ts          # 알림 발송
```

#### 1.4 analyze API 수정
```typescript
// platform 파라미터 추가
// 'toss': Toss sendMessage로 알림
// 'web': Solapi SMS로 알림
```

### Phase 2: 클라이언트 (web/index.html)

#### 2.1 제거할 것
- 전화번호 입력 단계 (Toss 로그인에서 자동 획득)
- Kakao OAuth 관련 코드
- TossPayments SDK 관련 코드

#### 2.2 추가할 것
```javascript
// Toss 로그인
const { authorizationCode, referrer } = await appLogin();

// Toss IAP
IAP.createOneTimePurchaseOrder({
  options: {
    sku: 'ssum_analysis_report',
    processProductGrant: async ({ orderId }) => {
      const res = await fetch('/api/payment/toss-iap', {
        method: 'POST',
        body: JSON.stringify({ orderId })
      });
      return res.ok;
    }
  },
  onEvent: (event) => { /* success */ },
  onError: (error) => { /* error */ }
});

// Toss Storage
await setItem('key', 'value');
const value = await getItem('key');

// Toss Haptic
await haptic();
```

#### 2.3 TDS 디자인 적용
```css
/* 색상 */
--toss-blue: #3182f6;
--toss-red: #f04452;
--toss-green: #00c853;

/* 타이포그래피 */
font-family: 'Toss Product Sans', -apple-system, sans-serif;

/* 간격 */
--spacing-4: 4px;
--spacing-8: 8px;
--spacing-16: 16px;

/* 모서리 */
--radius-8: 8px;
--radius-16: 16px;
```

### Phase 3: 빌드 및 배포

```bash
# granite 설정 (granite.config.ts)
export default defineConfig({
  appName: 'your-app-name',  # Toss 콘솔의 앱 ID와 일치해야 함
  brand: {
    displayName: '앱 이름',
    primaryColor: '#EC4899',
    icon: 'https://your-domain.com/logo.png',
  },
  entry: 'web/index.html',
});

# 빌드
npx granite build

# 결과물
your-app-name.ait → Toss 콘솔에 업로드
```

---

## File Structure

```
ssum-pro/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts        # 분석 (플랫폼별 알림)
│   │   │   ├── chat/route.ts           # AI 코치
│   │   │   ├── auth/
│   │   │   │   ├── kakao/              # Web용
│   │   │   │   └── toss/callback/      # Toss용
│   │   │   ├── payment/
│   │   │   │   ├── success/            # Web용 (TossPayments)
│   │   │   │   └── toss-iap/           # Toss용 (IAP)
│   │   │   └── notify/
│   │   │       └── toss/               # Toss 알림
│   │   ├── page.tsx                    # 웹 랜딩
│   │   ├── report/[id]/page.tsx        # 리포트
│   │   └── chat/[reportId]/page.tsx    # AI 코치 채팅
│   └── lib/
│       ├── gemini.ts                   # AI 분석
│       ├── solapi.ts                   # SMS (Web용)
│       └── toss.ts                     # Toss API (앱인토스용)
├── web/
│   └── index.html                      # 앱인토스 클라이언트
├── granite.config.ts                   # 앱인토스 빌드 설정
└── .env.local                          # 환경변수
```

---

## Troubleshooting

### mTLS 인증서 오류
```
Error: unable to get local issuer certificate
```
→ 인증서 경로 확인, 파일 권한 확인

### 복호화 실패
```
Error: Unsupported state or unable to authenticate data
```
→ DECRYPTION_KEY, AAD_STRING 값 확인

### appName 불일치
```
Error: App name mismatch
```
→ `granite.config.ts`의 appName이 Toss 콘솔의 앱 ID와 일치하는지 확인

### IAP 상품 없음
```
Error: INVALID_PRODUCT_ID
```
→ Toss 콘솔에서 SKU 등록 확인

---

## References

- [Apps-in-Toss 개발자센터](https://developers-apps-in-toss.toss.im)
- [toss/apps-in-toss-examples](https://github.com/toss/apps-in-toss-examples)
- [toss/toss-cert-examples](https://github.com/toss/toss-cert-examples)
- [TDS (Toss Design System)](https://developers-apps-in-toss.toss.im/design/overview.html)
