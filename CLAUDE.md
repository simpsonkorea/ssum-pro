# ssum-pro (읽씹당했나 / 카톡썸해석기)

AI 기반 카카오톡 대화 분석 서비스. 웹 + 토스 앱인토스 버전 지원.

## Quick Reference

### 현재 상태 (2026-01-25)
- **웹 버전**: Vercel 배포 완료
- **앱인토스**: 코드 완료, Toss 사업자 검토 대기중

### 검토 완료 후 필요한 것
사용자에게 아래 항목 요청:
1. `TOSS_DECRYPTION_KEY` (Base64 인코딩된 AES 키)
2. `TOSS_AAD_STRING` (AAD 문자열)
3. IAP SKU: `ssum_analysis_report` 등록 완료 여부

상세 체크리스트: `docs/TOSS-SETUP-CHECKLIST.md`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| AI | Google Gemini (gemini-2.0-flash) |
| Auth (Web) | Kakao OAuth |
| Auth (Toss) | Toss appLogin |
| Payment (Web) | TossPayments SDK |
| Payment (Toss) | Toss IAP |
| SMS (Web) | Solapi |
| SMS (Toss) | Toss sendMessage |
| Deploy | Vercel (Web), Toss Console (앱인토스) |

---

## Key Files

### API Routes
```
src/app/api/
├── analyze/route.ts        # 대화 분석 (platform 파라미터로 분기)
├── chat/route.ts           # AI 코치 채팅
├── auth/
│   ├── kakao/              # 웹용 Kakao OAuth
│   └── toss/callback/      # 앱인토스용 Toss OAuth
├── payment/
│   ├── success/            # 웹용 TossPayments 콜백
│   └── toss-iap/           # 앱인토스용 IAP 검증
└── notify/toss/            # 앱인토스 알림 발송
```

### Libraries
```
src/lib/
├── gemini.ts   # AI 분석 및 코치 프롬프트
├── solapi.ts   # Solapi SMS/LMS (웹용)
└── toss.ts     # Toss API 유틸리티 (앱인토스용)
```

### Apps-in-Toss
```
web/index.html      # 앱인토스 클라이언트 (단일 파일)
granite.config.ts   # 앱인토스 빌드 설정
chat-decoder.ait    # 빌드 결과물
```

---

## Environment Variables

```bash
# Gemini
GEMINI_API_KEY=

# Kakao (웹용)
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=

# Solapi (웹용)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_PHONE=

# Toss (앱인토스용)
TOSS_MTLS_CERT_PATH=
TOSS_MTLS_KEY_PATH=
TOSS_DECRYPTION_KEY=      # ⏳ 발급 대기
TOSS_AAD_STRING=          # ⏳ 발급 대기
TOSS_NOTIFICATION_TEMPLATE=chat_decoder_analysis_complete
```

---

## Commands

```bash
# 개발 서버
npm run dev

# 앱인토스 빌드
npx granite build

# 빌드 결과물 복사
cp chat-decoder.ait ~/Downloads/
```

---

## Migration Guide

웹 → 앱인토스 마이그레이션 프로세스:
`docs/APPS-IN-TOSS-MIGRATION.md` 참조

---

## Notes

- 앱인토스는 mTLS 인증서 필수 (서버-to-서버 통신)
- 개인정보는 AES-256-GCM으로 암호화되어 전달됨
- IAP 영수증 검증은 Toss 서버에서 자동 처리
- 테스트 모드: mTLS 설정 없으면 자동으로 테스트 데이터 반환
