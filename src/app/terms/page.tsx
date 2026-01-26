'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">서비스 이용약관</h1>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 리텐션(이하 "회사")이 제공하는 읽씹당했나 서비스(이하 "서비스")의
              이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을
              규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제2조 (정의)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>"서비스"란 회사가 제공하는 AI 기반 대화 분석 및 연애 코칭 서비스를 의미합니다.</li>
              <li>"이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              <li>"회원"이란 서비스에 가입하여 이용계약을 체결한 자를 말합니다.</li>
              <li>"콘텐츠"란 서비스 내에서 제공되는 분석 결과, 코칭 내용 등을 의미합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 공지합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제4조 (서비스의 제공)</h2>
            <p className="mb-3">회사는 다음과 같은 서비스를 제공합니다:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>카카오톡 대화 내용 AI 분석 서비스</li>
              <li>AI 연애 코치 상담 서비스</li>
              <li>분석 리포트 제공 서비스</li>
              <li>기타 회사가 정하는 서비스</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제5조 (서비스 이용료)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스 이용료는 서비스 내 안내된 금액에 따릅니다.</li>
              <li>결제 완료 후 서비스가 제공되며, 디지털 콘텐츠의 특성상 제공 완료 후 환불이 제한될 수 있습니다.</li>
              <li>단, 서비스 장애로 인해 정상적인 이용이 불가능한 경우 회사는 환불 조치를 취할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제6조 (이용자의 의무)</h2>
            <p className="mb-3">이용자는 다음 행위를 하여서는 안 됩니다:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>타인의 개인정보를 무단으로 수집, 이용하는 행위</li>
              <li>서비스를 이용하여 얻은 정보를 회사의 동의 없이 상업적으로 이용하는 행위</li>
              <li>회사 또는 제3자의 저작권 등 지적재산권을 침해하는 행위</li>
              <li>서비스의 안정적 운영을 방해하는 행위</li>
              <li>기타 관련 법령에 위배되는 행위</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제7조 (개인정보 보호)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회사는 이용자의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고 이를 준수합니다.</li>
              <li>이용자가 업로드한 대화 내용은 분석 목적으로만 사용되며, 분석 완료 후 즉시 삭제됩니다.</li>
              <li>회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제8조 (면책조항)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
              <li>AI 분석 결과는 참고용이며, 실제 관계나 상황에 대한 전문적인 조언을 대체하지 않습니다.</li>
              <li>이용자가 서비스를 이용하여 얻은 정보에 따른 판단 및 행동의 결과에 대해 회사는 책임지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제9조 (분쟁해결)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회사와 이용자 간에 발생한 분쟁은 상호 협의하여 해결합니다.</li>
              <li>협의가 이루어지지 않을 경우, 관할 법원은 회사 소재지 관할 법원으로 합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">부칙</h2>
            <p>본 약관은 2026년 1월 25일부터 시행됩니다.</p>
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
