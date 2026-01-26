# Toss 앱인토스 설정 체크리스트

프로젝트: **카톡썸해석기 (chat-decoder)**
회사: **리텐션**

---

## 현재 상태 (2026-01-25)

### 코드 준비 상태

| 항목 | 상태 | 파일 |
|------|------|------|
| Toss 라이브러리 | ✅ 완료 | `src/lib/toss.ts` |
| OAuth 콜백 API | ✅ 완료 | `src/app/api/auth/toss/callback/route.ts` |
| IAP 검증 API | ✅ 완료 | `src/app/api/payment/toss-iap/route.ts` |
| 알림 API | ✅ 완료 | `src/app/api/notify/toss/route.ts` |
| analyze API 수정 | ✅ 완료 | `src/app/api/analyze/route.ts` |
| 클라이언트 (web/) | ✅ 완료 | `web/index.html` |
| TDS 디자인 적용 | ✅ 완료 | `web/index.html` |
| .ait 번들 | ✅ 빌드완료 | `chat-decoder.ait` |

### Toss 콘솔 상태

| 항목 | 상태 | 다음 단계 |
|------|------|-----------|
| 사업자 정보 검토 | ⏳ 검토중 | 약 1일 대기 |
| mTLS 인증서 | ✅ 발급완료 | 경로 설정 필요 |
| 토스 로그인 | ❌ 대기 | 검토 완료 후 등록 |
| 복호화 키 | ❌ 대기 | 로그인 등록 후 발급 |
| IAP 상품 | ❌ 대기 | 검토 완료 후 등록 |
| 알림 템플릿 | ❌ 대기 | 검토 완료 후 등록 |

---

## 검토 완료 후 할 일

### Step 1: 토스 로그인 등록
1. 앱인토스 콘솔 > 개발 > 토스 로그인
2. "등록하기" 클릭
3. 필요 정보 입력 후 등록

### Step 2: 복호화 키 발급
1. 토스 로그인 등록 완료 후
2. "개인정보 암복호화 키" 메뉴 접근
3. 키 발급 요청
4. 받은 값을 `.env.local`에 추가:
```bash
TOSS_DECRYPTION_KEY={발급받은_Base64_키}
TOSS_AAD_STRING={발급받은_AAD_문자열}
```

### Step 3: IAP 상품 등록
1. 앱인토스 콘솔 > 개발 > IAP (또는 인앱결제)
2. 상품 추가:
   - **SKU**: `ssum_analysis_report`
   - **가격**: 29,900원
   - **상품명**: 썸 분석 리포트
   - **설명**: AI 연애 코치 100회 상담 포함

### Step 4: 알림 템플릿 등록 (선택)
1. 앱인토스 콘솔 > 개발 > 푸시/알림
2. 템플릿 추가:
   - **코드**: `chat_decoder_analysis_complete`
   - **제목**: 썸 분석 완료
   - **내용**: `{{userName}}님의 썸 분석이 완료되었어요!`
   - **변수**: userName, reportId, reportLink, analysisDate

### Step 5: 환경변수 최종 설정
```bash
# .env.local

# mTLS 인증서
TOSS_MTLS_CERT_PATH=/Users/gyusupsim/Downloads/toss_mtls/카톡썸인증서_public.crt
TOSS_MTLS_KEY_PATH=/Users/gyusupsim/Downloads/toss_mtls/카톡썸인증서_private.key

# 복호화 키 (Step 2에서 발급)
TOSS_DECRYPTION_KEY=여기에_발급받은_키_입력
TOSS_AAD_STRING=여기에_발급받은_AAD_입력

# 알림 템플릿 (Step 4에서 등록)
TOSS_NOTIFICATION_TEMPLATE=chat_decoder_analysis_complete
```

### Step 6: 재빌드 및 업로드
```bash
cd ssum-pro
npx granite build
# chat-decoder.ait 생성됨 → Toss 콘솔에 업로드
```

---

## 인증서 파일 위치

```
~/Downloads/toss_mtls/
├── 카톡썸인증서_public.crt   # mTLS 인증서
└── 카톡썸인증서_private.key  # mTLS 개인키
```

---

## 테스트 방법

### 로컬 테스트 (mTLS 없이)
현재 코드는 mTLS 인증서가 없으면 **테스트 모드**로 동작:
- 로그인: 테스트 유저 반환
- IAP: 테스트 성공 반환
- 알림: 콘솔 로그만 출력

### 실제 테스트
1. Toss 앱 샌드박스 환경에서 테스트
2. `referrer: 'SANDBOX'`로 API 호출

---

## 관련 문서

- [APPS-IN-TOSS-MIGRATION.md](./APPS-IN-TOSS-MIGRATION.md) - 전체 마이그레이션 가이드
- [Toss 개발자센터](https://developers-apps-in-toss.toss.im)

---

## 담당자 리마인더

검토 완료 알림 받으면:
1. 이 문서의 "검토 완료 후 할 일" 섹션 따라 진행
2. 모든 환경변수 설정 후 Claude에게 ".env.local 업데이트했어, 재빌드해줘" 요청
