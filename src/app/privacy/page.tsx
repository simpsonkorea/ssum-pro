'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          <p>
            리텐션(이하 "회사")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」을
            준수하고 있습니다. 회사는 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가
            어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가
            취해지고 있는지 알려드립니다.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. 수집하는 개인정보 항목</h2>
            <p className="mb-3">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
            <p className="mb-2 text-xs text-gray-500">※ 회원가입 방식에 따라 수집 항목이 다릅니다.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>휴대폰 회원가입 시 (필수):</strong> 휴대폰 번호, 이름, 비밀번호</li>
              <li><strong>휴대폰 회원가입 시 (선택):</strong> 출생연도, 성별</li>
              <li><strong>카카오 로그인 시 (필수):</strong> 카카오 계정 정보(닉네임, 프로필 사진, 이메일)</li>
              <li><strong>서비스 이용 시:</strong> 업로드한 대화 내용(분석 후 즉시 삭제)</li>
              <li><strong>자동 수집:</strong> 서비스 이용기록, 접속 로그, 결제 기록</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 개인정보의 수집 및 이용목적</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>서비스 제공:</strong> 대화 분석, AI 코칭, 분석 결과 제공</li>
              <li><strong>회원 관리:</strong> 회원 식별, 서비스 이용 내역 관리</li>
              <li><strong>알림 발송:</strong> 분석 완료 알림, 서비스 관련 안내</li>
              <li><strong>결제 처리:</strong> 유료 서비스 결제 및 환불 처리</li>
              <li><strong>서비스 개선:</strong> 통계 분석을 통한 서비스 품질 향상</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. 개인정보의 보유 및 이용기간</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>회원 정보:</strong> 회원 탈퇴 시까지</li>
              <li><strong>대화 내용:</strong> 분석 완료 후 즉시 삭제 (서버에 저장하지 않음)</li>
              <li><strong>결제 기록:</strong> 전자상거래법에 따라 5년간 보관</li>
              <li><strong>접속 로그:</strong> 3개월간 보관 후 삭제</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
              다만, 아래의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. 개인정보의 처리 위탁</h2>
            <p className="mb-3">회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다:</p>
            <table className="w-full border-collapse border border-gray-300 mt-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">수탁업체</th>
                  <th className="border border-gray-300 p-2 text-left">위탁 업무</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Google Cloud (Gemini)</td>
                  <td className="border border-gray-300 p-2">AI 분석 처리</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Supabase</td>
                  <td className="border border-gray-300 p-2">회원정보 및 인증 데이터 저장</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">토스페이먼츠</td>
                  <td className="border border-gray-300 p-2">결제 처리</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">솔라피(Solapi)</td>
                  <td className="border border-gray-300 p-2">SMS 인증번호 및 알림 발송</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. 이용자의 권리</h2>
            <p className="mb-3">이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
            <p className="mt-3">
              위 권리 행사는 이메일(hello@retn.kr)을 통해 요청하실 수 있으며,
              회사는 지체 없이 조치하겠습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. 개인정보의 파기</h2>
            <p>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게
              되었을 때에는 지체 없이 해당 개인정보를 파기합니다. 전자적 파일 형태의
              정보는 복구 및 재생이 되지 않도록 기술적인 방법을 이용하여 삭제합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. 개인정보보호책임자</h2>
            <ul className="list-none space-y-1">
              <li><strong>성명:</strong> 심규섭</li>
              <li><strong>직위:</strong> 대표</li>
              <li><strong>이메일:</strong> hello@retn.kr</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. 개인정보처리방침의 변경</h2>
            <p>
              본 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의
              추가, 삭제 및 수정이 있을 수 있으며, 변경 시 서비스 내 공지사항을 통해
              고지합니다.
            </p>
          </section>

          <section>
            <p className="font-semibold">시행일: 2026년 1월 26일 (v1.1)</p>
            <p className="text-xs text-gray-500 mt-1">변경내역: 휴대폰 회원가입 방식 추가, 수집항목 세분화, Supabase 위탁업체 추가</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>리텐션 (Retention Inc.)</p>
          <p className="mt-1">문의: hello@retn.kr</p>
        </div>
      </div>
    </div>
  );
}
