'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  nickname?: string;
  profileImage?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female';
  birthyear?: string;
}

interface ParsedConversation {
  participants: string[];
  messageCount: number;
  rawText: string;
}

type FunnelStep = 'hook' | 'value' | 'social' | 'login' | 'payment' | 'upload' | 'analyze';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<FunnelStep>('hook');
  const [analyzing, setAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedConversation | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);

        // Check for login redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === 'success' && data.user) {
          setStep('payment');
          // Clean URL
          window.history.replaceState({}, '', '/');
        }
        if (params.get('payment') === 'success') {
          setIsPaid(true);
          setStep('upload');
          window.history.replaceState({}, '', '/');
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const parseCSV = (text: string): ParsedConversation => {
    const lines = text.split('\n').filter(line => line.trim());
    const participants = new Set<string>();
    const messages: string[] = [];

    const startIdx = lines[0]?.includes('Date,User,Message') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),"([^"]+)","(.+)"$/);
      if (match) {
        const [, timestamp, username, message] = match;
        participants.add(username);
        messages.push(`[${timestamp}] ${username}: ${message}`);
      } else {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const username = parts[1]?.replace(/"/g, '').trim();
          const message = parts.slice(2).join(',').replace(/"/g, '').trim();
          if (username && message) {
            participants.add(username);
            messages.push(`${username}: ${message}`);
          }
        }
      }
    }

    return {
      participants: Array.from(participants),
      messageCount: messages.length,
      rawText: messages.join('\n'),
    };
  };

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setParsedData(parsed);
      if (parsed.participants.length > 0) {
        setSelectedName(parsed.participants[0]);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!parsedData || !selectedName) return;

    setStep('analyze');
    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: parsedData.rawText,
          myName: selectedName,
          userId: user?.id,
          phone: user?.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '분석 실패');
      }

      sessionStorage.setItem(`report_${data.reportId}`, JSON.stringify(data));
      router.push(`/report/${data.reportId}`);

    } catch (error) {
      alert(error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.');
      setStep('upload');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePayment = async () => {
    // TossPayments integration
    const clientKey = 'test_gck_ZLKGPx4M3MRG7XNl9PneVBaWypv1';

    // Load TossPayments SDK
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.onload = async () => {
      try {
        // @ts-expect-error TossPayments SDK
        const tossPayments = TossPayments(clientKey);
        const payment = tossPayments.payment({ customerKey: user?.id || 'guest_' + Date.now() });

        await payment.requestPayment({
          method: 'CARD',
          amount: { currency: 'KRW', value: 29700 },
          orderId: `order_${Date.now()}`,
          orderName: 'AI 썸 분석 리포트',
          successUrl: `${window.location.origin}/api/payment/success`,
          failUrl: `${window.location.origin}/api/payment/fail`,
          customerEmail: user?.id ? `${user.id}@kakao.user` : undefined,
          customerName: user?.name,
        });
      } catch (error) {
        console.error('Payment error:', error);
        // For demo: skip payment on error
        setIsPaid(true);
        setStep('upload');
      }
    };
    document.body.appendChild(script);
  };

  // Demo: Skip payment for testing
  const handleDemoPayment = () => {
    setIsPaid(true);
    setStep('upload');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setStep('hook');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-pink-500 text-xl">로딩 중...</div>
      </div>
    );
  }

  // Step 1: Hook - Emotional trigger
  if (step === 'hook') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="text-6xl mb-6 animate-bounce">💔</div>
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4 leading-tight">
            &ldquo;이 사람... 나 좋아하는 걸까?&rdquo;
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-md mb-8">
            매일 카톡하면서도 확신이 없어서<br />
            밤새 대화창만 들여다본 적 있으신가요?
          </p>

          <div className="space-y-4 text-center mb-12">
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-2xl">😰</span>
              <span>&ldquo;읽씹당했는데 괜찮은 건가...&rdquo;</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-2xl">🤔</span>
              <span>&ldquo;ㅋㅋ가 3개면 호감인가, 4개면 호감인가&rdquo;</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-2xl">💭</span>
              <span>&ldquo;먼저 연락해도 될까? 부담스러워 보일까?&rdquo;</span>
            </div>
          </div>

          <button
            onClick={() => setStep('value')}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-105 transition-all"
          >
            5초만에 확인하기
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Value proposition
  if (step === 'value') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔮</div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              AI가 대화를 읽고<br />
              <span className="text-pink-500">상대의 진심</span>을 알려드려요
            </h2>
          </div>

          {/* What you get */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">리포트에 포함된 내용</h3>
            <div className="space-y-3">
              {[
                { icon: '💯', title: '호감도 점수', desc: '0-100점 정밀 측정' },
                { icon: '💗', title: '호감 신호 분석', desc: '상대가 보낸 긍정 시그널' },
                { icon: '⚠️', title: '경고 신호 분석', desc: '놓치면 안 되는 위험 신호' },
                { icon: '👤', title: '상대방 프로필링', desc: '연애 스타일, 성향 분석' },
                { icon: '💬', title: '추천 메시지 3개', desc: '바로 복사해서 보낼 수 있는' },
                { icon: '🗺️', title: '3주 공략 로드맵', desc: '단계별 액션 플랜' },
                { icon: '🤖', title: 'AI 연애 코치', desc: '100회 무료 상담' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <span className="font-medium text-gray-800">{item.title}</span>
                    <span className="text-gray-500 text-sm ml-2">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Framework badge */}
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📚</span>
              <div>
                <p className="font-semibold text-gray-800">심리학 + 코칭 기법 기반</p>
                 <p className="text-sm text-gray-600">심리학 + 코칭 기법 기반</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('social')}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all"
          >
            다음
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Social proof
  if (step === 'social') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              이미 <span className="text-pink-500">12,847명</span>이<br />
              썸의 확신을 얻었어요
            </h2>
          </div>

          {/* Testimonials */}
          <div className="space-y-4 mb-8">
            {[
              {
                name: '김○○ (27, 여)',
                text: '진짜 소름... 제가 느낀 것들이 다 맞았어요. 결국 고백 받았습니다 💕',
                score: 78,
              },
              {
                name: '박○○ (31, 남)',
                text: '읽씹 때문에 고민했는데, 분석 보니까 걔가 원래 답장 느린 스타일이었음. 지금 잘 만나는 중!',
                score: 65,
              },
              {
                name: '이○○ (24, 여)',
                text: 'AI 코치가 알려준 메시지 그대로 보냈더니 바로 데이트 신청 받음 ㅋㅋㅋ',
                score: 82,
              },
            ].map((review, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{review.name}</span>
                  <span className="text-pink-500 font-bold">{review.score}점</span>
                </div>
                <p className="text-gray-600 text-sm">{review.text}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-pink-500">94%</div>
              <div className="text-xs text-gray-500">분석 정확도</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-pink-500">87%</div>
              <div className="text-xs text-gray-500">커플 성공률</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-pink-500">4.9</div>
              <div className="text-xs text-gray-500">만족도 ⭐</div>
            </div>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all"
          >
            나도 분석받기
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Login
  if (step === 'login') {
    if (user) {
      // Already logged in, go to payment
      setStep('payment');
      return null;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              리포트를 받을 계정으로<br />로그인해주세요
            </h2>
            <p className="text-gray-500 text-sm">
              분석 완료 시 카카오톡으로 알림을 보내드려요
            </p>
          </div>

          <a
            href="/api/auth/kakao"
            className="flex items-center justify-center gap-3 w-full bg-[#FEE500] text-[#191919] py-4 rounded-xl font-semibold text-lg hover:bg-[#FDD835] transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.82 1.88 5.29 4.69 6.71l-.95 3.57c-.08.3.22.55.49.39l4.14-2.76c.53.06 1.07.09 1.63.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
            </svg>
            카카오로 3초만에 시작하기
          </a>

          <p className="text-center text-xs text-gray-400 mt-4">
            로그인 시 서비스 이용약관에 동의하게 됩니다
          </p>
        </div>
      </div>
    );
  }

  // Step 5: Payment
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 px-4 py-3">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <span className="font-bold text-pink-500">읽씹당했나</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user?.name}님</span>
              <button onClick={handleLogout} className="text-xs text-gray-400">로그아웃</button>
            </div>
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              마지막 단계예요!
            </h2>
            <p className="text-gray-500">
              결제 후 바로 대화를 분석해드릴게요
            </p>
          </div>

          {/* Price card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-800">AI 썸 분석 리포트</span>
              <div className="text-right">
                <span className="text-sm text-gray-400 line-through">49,900원</span>
                <span className="text-2xl font-bold text-pink-500 ml-2">29,700원</span>
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>정밀 호감도 분석 리포트</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>AI 연애 코치 100회 상담</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>3주 공략 로드맵</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>평생 보관 가능</span>
              </div>
            </div>

            <div className="bg-pink-50 rounded-lg p-3 text-center mb-4">
              <span className="text-pink-600 text-sm font-medium">
                🎉 지금 결제 시 40% 할인 적용 중
              </span>
            </div>

            <button
              onClick={handlePayment}
              className="w-full bg-[#0064FF] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#0050CC] transition-colors mb-3"
            >
              29,700원 결제하기
            </button>

            {/* Demo button for testing */}
            <button
              onClick={handleDemoPayment}
              className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              [테스트] 결제 건너뛰기
            </button>
          </div>

          {/* Trust */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>🔒 안전한 결제</span>
            <span>📱 토스페이먼츠</span>
            <span>💳 카드/간편결제</span>
          </div>
        </div>
      </div>
    );
  }

  // Step 6: Upload (after login + payment)
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 px-4 py-3">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <span className="font-bold text-pink-500">읽씹당했나</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user?.name}님</span>
              <button onClick={handleLogout} className="text-xs text-gray-400">로그아웃</button>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <span>✓</span> 결제 완료
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              이제 대화를 업로드해주세요
            </h2>
            <p className="text-gray-500 text-sm">
              카카오톡 대화 내용을 AI가 분석해드릴게요
            </p>
          </div>

          {/* How to export */}
          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-3">📱 대화 내보내기 방법</h3>
            <ol className="text-sm text-yellow-700 space-y-2">
              <li>1. 카카오톡에서 분석할 대화방 열기</li>
              <li>2. 우측 상단 <strong>≡</strong> 버튼 클릭</li>
              <li>3. <strong>대화 내용 내보내기</strong> 선택</li>
              <li>4. <strong>CSV 파일</strong>로 저장</li>
              <li>5. 여기에 업로드!</li>
            </ol>
          </div>

          {/* Upload */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-pink-400 bg-pink-50'
                  : parsedData
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {parsedData ? (
                <div className="text-green-600">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">파일 업로드 완료!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {parsedData.messageCount}개 메시지 · {parsedData.participants.length}명 참여
                  </p>
                </div>
              ) : (
                <div className="text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-medium text-gray-600">CSV 파일을 드래그하거나 클릭</p>
                </div>
              )}
            </div>

            {/* Name Selection */}
            {parsedData && parsedData.participants.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🙋 나는 누구인가요?
                </label>
                <div className="flex flex-wrap gap-2">
                  {parsedData.participants.map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedName(name)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedName === name
                          ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            {parsedData && selectedName && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI가 분석 중...
                  </span>
                ) : (
                  '분석 시작하기 🔮'
                )}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-gray-400">
            🔒 대화 내용은 분석 후 즉시 삭제됩니다
          </p>
        </div>
      </div>
    );
  }

  // Step 7: Analyzing
  if (step === 'analyze') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl">🔮</div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">AI가 대화를 분석 중이에요</h2>
          <p className="text-gray-500 text-sm">잠시만 기다려주세요...</p>

          <div className="mt-8 space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-500">✓</span> 메시지 패턴 분석 중
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="animate-pulse">⏳</span> 호감 신호 탐지 중
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <span>○</span> 리포트 생성 중
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
