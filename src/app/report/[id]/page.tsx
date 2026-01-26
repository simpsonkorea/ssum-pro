'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Signal {
  name: string;
  description: string;
  count: number;
  significance?: string;
}

interface Highlight {
  type: 'positive' | 'negative';
  message: string;
  analysis: string;
  implication?: string;
}

interface CriticalMoment {
  moment: string;
  whatHappened: string;
  impact: string;
  betterApproach: string;
}

interface MessageSuggestion {
  message: string;
  context: string;
  expectedReaction: string;
  followUp: string;
}

interface RoadmapItem {
  period: string;
  goal: string;
  actions: string[];
  successIndicator?: string;
}

interface DateStrategy {
  readiness: string;
  idealTiming: string;
  suggestedActivity: string;
  approachScript: string;
}

interface FinalVerdict {
  currentStatus: string;
  biggestStrength: string;
  biggestConcern: string;
  successProbability: string;
  oneThingToFocus: string;
}

interface AnalysisResult {
  reportId: string;
  ssumScore: number;
  level: string;
  summary: string;
  positiveSignals: Signal[];
  negativeSignals: Signal[];
  frameAnalysis: {
    initiator: string;
    initiatorDescription: string;
    questionRatio: { me: number; other: number };
    conversationLeader: string;
    leaderDescription: string;
    investmentBalance?: {
      myInvestment: string;
      theirInvestment: string;
      analysis: string;
    };
    emotionalTemperature?: {
      early: string;
      late: string;
      trend: string;
      analysis: string;
    };
  };
  partnerProfile: {
    responseStyle: string;
    interestExpression: string;
    estimatedType: string;
    typeDescription?: string;
    communicationTips?: string[];
    psychologicalInsight?: string;
  };
  conversationDynamics?: {
    avgMessageLength?: { me: number; other: number };
    responseTimePattern?: string;
    topicInitiation?: { me: string; other: string };
    emotionalContent?: string;
    overallAssessment?: string;
  };
  advice: string[];
  thingsToDo?: string[];
  thingsToAvoid?: string[];
  nextMessageSuggestions: (string | MessageSuggestion)[];
  dateStrategy?: DateStrategy;
  warningFlags: string[];
  highlights: Highlight[];
  criticalMoments?: CriticalMoment[];
  roadmap?: RoadmapItem[];
  finalVerdict?: FinalVerdict;
}

function ScoreGauge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'from-pink-500 to-red-500';
    if (s >= 60) return 'from-orange-400 to-pink-500';
    if (s >= 40) return 'from-yellow-400 to-orange-400';
    return 'from-gray-400 to-yellow-400';
  };

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${score * 2.83} 283`}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-bold bg-gradient-to-r ${getColor(score)} bg-clip-text text-transparent`}>
          {score}
        </span>
        <span className="text-sm text-gray-500 mt-1">/ 100</span>
      </div>
    </div>
  );
}

function SignalCard({ signal, type }: { signal: Signal; type: 'positive' | 'negative' }) {
  return (
    <div className={`p-4 rounded-xl border ${
      type === 'positive'
        ? 'bg-pink-50 border-pink-200'
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800">{signal.name}</span>
        <span className={`text-sm px-2 py-0.5 rounded-full ${
          type === 'positive'
            ? 'bg-pink-200 text-pink-700'
            : 'bg-gray-200 text-gray-700'
        }`}>
          {signal.count}회
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{signal.description}</p>
      {signal.significance && (
        <p className="text-xs text-gray-500 italic border-t border-gray-200 pt-2 mt-2">
          {signal.significance}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2 pt-6 first:pt-0">
      <span className="text-2xl">{icon}</span> {title}
    </h3>
  );
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(`report_${id}`);
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">리포트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">리포트를 찾을 수 없습니다.</p>
          <Link href="/" className="text-pink-500 underline">처음으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const getLevelEmoji = (level: string) => {
    if (level.includes('확실')) return '💕';
    if (level.includes('썸')) return '💗';
    if (level.includes('가능')) return '💫';
    return '🤔';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            읽씹당했나
          </Link>
          <button
            onClick={() => {
              navigator.share?.({
                title: '썸 분석 리포트',
                url: window.location.href,
              }).catch(() => {
                navigator.clipboard.writeText(window.location.href);
                alert('링크가 복사되었습니다!');
              });
            }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            공유
          </button>
        </div>
      </header>

      {/* Hero Score Section */}
      <section className="py-8 text-center">
        <div className="inline-block mb-4">
          <span className="text-4xl">{getLevelEmoji(data.level)}</span>
        </div>
        <ScoreGauge score={data.ssumScore} />
        <div className="mt-4">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold">
            {data.level}
          </span>
        </div>
        <p className="mt-6 text-gray-600 max-w-md mx-auto px-4 leading-relaxed">
          {data.summary}
        </p>
      </section>

      {/* All Content in One Scroll */}
      <main className="max-w-2xl mx-auto px-4 space-y-6">

        {/* Final Verdict (if exists) */}
        {data.finalVerdict && (
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl shadow-lg p-6">
            <SectionTitle icon="🎯" title="최종 진단" />
            <div className="space-y-4 mt-4">
              <div>
                <span className="text-pink-100 text-sm">현재 상태</span>
                <p className="font-semibold text-lg">{data.finalVerdict.currentStatus}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-xl p-3">
                  <span className="text-pink-100 text-xs">강점</span>
                  <p className="text-sm">{data.finalVerdict.biggestStrength}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-3">
                  <span className="text-pink-100 text-xs">우려</span>
                  <p className="text-sm">{data.finalVerdict.biggestConcern}</p>
                </div>
              </div>
              <div className="bg-white/20 rounded-xl p-4 text-center">
                <span className="text-pink-100 text-sm">성공 확률</span>
                <p className="font-bold text-2xl">{data.finalVerdict.successProbability}</p>
              </div>
              <div className="border-t border-white/30 pt-4">
                <span className="text-pink-100 text-sm">지금 가장 집중해야 할 것</span>
                <p className="font-semibold">{data.finalVerdict.oneThingToFocus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Partner Profile */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <SectionTitle icon="👤" title="상대방 프로필 분석" />
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {data.partnerProfile.estimatedType}
              </span>
            </div>
            {data.partnerProfile.typeDescription && (
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-gray-700 text-sm">{data.partnerProfile.typeDescription}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-500 font-medium">답장 스타일</span>
              <p className="text-gray-700 mt-1">{data.partnerProfile.responseStyle}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 font-medium">관심 표현 방식</span>
              <p className="text-gray-700 mt-1">{data.partnerProfile.interestExpression}</p>
            </div>
            {data.partnerProfile.psychologicalInsight && (
              <div className="p-4 bg-pink-50 rounded-xl border-l-4 border-pink-400">
                <span className="text-sm text-pink-600 font-medium">심리 인사이트</span>
                <p className="text-gray-700 mt-1">{data.partnerProfile.psychologicalInsight}</p>
              </div>
            )}
            {data.partnerProfile.communicationTips && data.partnerProfile.communicationTips.length > 0 && (
              <div>
                <span className="text-sm text-gray-500 font-medium">소통 팁</span>
                <ul className="mt-2 space-y-2">
                  {data.partnerProfile.communicationTips.map((tip, i) => (
                    <li key={i} className="text-gray-700 text-sm flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="text-pink-500 font-bold">{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Frame Analysis */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <SectionTitle icon="⚖️" title="대화 역학 분석" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-pink-50 rounded-xl">
              <div className="text-3xl font-bold text-pink-500">{data.frameAnalysis.questionRatio.me}</div>
              <div className="text-xs text-gray-500 mt-1">내 질문 수</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-500">{data.frameAnalysis.questionRatio.other}</div>
              <div className="text-xs text-gray-500 mt-1">상대 질문 수</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500 font-medium">대화 시작 패턴</span>
              <p className="text-gray-700 text-sm mt-1">{data.frameAnalysis.initiatorDescription}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500 font-medium">대화 주도권</span>
              <p className="text-gray-700 text-sm mt-1">{data.frameAnalysis.leaderDescription}</p>
            </div>
            {data.frameAnalysis.investmentBalance && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-sm text-yellow-700 font-medium">투자 밸런스</span>
                <div className="flex justify-between mt-2 mb-2">
                  <span className="text-sm">내 투자: <b>{data.frameAnalysis.investmentBalance.myInvestment}</b></span>
                  <span className="text-sm">상대 투자: <b>{data.frameAnalysis.investmentBalance.theirInvestment}</b></span>
                </div>
                <p className="text-gray-700 text-sm">{data.frameAnalysis.investmentBalance.analysis}</p>
              </div>
            )}
            {data.frameAnalysis.emotionalTemperature && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-700 font-medium">감정 온도 변화</span>
                <div className="flex items-center gap-2 mt-2 mb-2">
                  <span className="text-sm bg-blue-100 px-2 py-1 rounded">{data.frameAnalysis.emotionalTemperature.early}</span>
                  <span className="text-blue-400">→</span>
                  <span className="text-sm bg-blue-100 px-2 py-1 rounded">{data.frameAnalysis.emotionalTemperature.late}</span>
                  <span className={`text-sm px-2 py-1 rounded font-medium ${
                    data.frameAnalysis.emotionalTemperature.trend === '상승' ? 'bg-green-100 text-green-700' :
                    data.frameAnalysis.emotionalTemperature.trend === '하락' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {data.frameAnalysis.emotionalTemperature.trend}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{data.frameAnalysis.emotionalTemperature.analysis}</p>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Dynamics */}
        {data.conversationDynamics && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <SectionTitle icon="📊" title="대화 통계" />
            <div className="space-y-4">
              {data.conversationDynamics.avgMessageLength && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-700">{data.conversationDynamics.avgMessageLength.me}</div>
                    <div className="text-xs text-gray-500">내 평균 글자수</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-700">{data.conversationDynamics.avgMessageLength.other}</div>
                    <div className="text-xs text-gray-500">상대 평균 글자수</div>
                  </div>
                </div>
              )}
              {data.conversationDynamics.responseTimePattern && (
                <div>
                  <span className="text-sm text-gray-500 font-medium">답장 속도 패턴</span>
                  <p className="text-gray-700 text-sm mt-1">{data.conversationDynamics.responseTimePattern}</p>
                </div>
              )}
              {data.conversationDynamics.emotionalContent && (
                <div>
                  <span className="text-sm text-gray-500 font-medium">감정 표현</span>
                  <p className="text-gray-700 text-sm mt-1">{data.conversationDynamics.emotionalContent}</p>
                </div>
              )}
              {data.conversationDynamics.overallAssessment && (
                <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                  <p className="text-gray-700">{data.conversationDynamics.overallAssessment}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Highlights */}
        {data.highlights && data.highlights.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <SectionTitle icon="💬" title="핵심 메시지 분석" />
            <div className="space-y-4">
              {data.highlights.map((highlight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border-l-4 ${
                    highlight.type === 'positive'
                      ? 'bg-pink-50 border-pink-400'
                      : 'bg-gray-50 border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={highlight.type === 'positive' ? 'text-pink-500' : 'text-gray-500'}>
                      {highlight.type === 'positive' ? '💗' : '💔'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      highlight.type === 'positive' ? 'bg-pink-200 text-pink-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {highlight.type === 'positive' ? '호감 신호' : '주의 신호'}
                    </span>
                  </div>
                  <p className="text-gray-800 font-medium mb-2 bg-white/50 p-2 rounded">&ldquo;{highlight.message}&rdquo;</p>
                  <p className="text-sm text-gray-600">{highlight.analysis}</p>
                  {highlight.implication && (
                    <p className="text-xs text-gray-500 mt-2 italic">→ {highlight.implication}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Moments */}
        {data.criticalMoments && data.criticalMoments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <SectionTitle icon="⚡" title="결정적 순간들" />
            <div className="space-y-4">
              {data.criticalMoments.map((moment, i) => (
                <div key={i} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="font-medium text-amber-800 mb-2">{moment.moment}</p>
                  <p className="text-sm text-gray-700 mb-2">{moment.whatHappened}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2 bg-white rounded-lg">
                      <span className="text-xs text-gray-500">영향</span>
                      <p className="text-sm text-gray-700">{moment.impact}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <span className="text-xs text-green-600">더 나은 대응</span>
                      <p className="text-sm text-gray-700">{moment.betterApproach}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positive Signals */}
        {data.positiveSignals && data.positiveSignals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <SectionTitle icon="💗" title={`호감 신호 (${data.positiveSignals.length}개)`} />
            <div className="space-y-3">
              {data.positiveSignals.map((signal, i) => (
                <SignalCard key={i} signal={signal} type="positive" />
              ))}
            </div>
          </div>
        )}

        {/* Negative Signals */}
        {data.negativeSignals && data.negativeSignals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <SectionTitle icon="💔" title={`비호감 신호 (${data.negativeSignals.length}개)`} />
            <div className="space-y-3">
              {data.negativeSignals.map((signal, i) => (
                <SignalCard key={i} signal={signal} type="negative" />
              ))}
            </div>
          </div>
        )}

        {/* Warning Flags */}
        {data.warningFlags && data.warningFlags.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
            <SectionTitle icon="⚠️" title="주의사항" />
            <ul className="space-y-2">
              {data.warningFlags.map((flag, i) => (
                <li key={i} className="text-amber-700 text-sm flex items-start gap-2 p-2 bg-white/50 rounded-lg">
                  <span className="mt-0.5">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Things To Do & Avoid */}
        {(data.thingsToDo || data.thingsToAvoid) && (
          <div className="grid md:grid-cols-2 gap-4">
            {data.thingsToDo && data.thingsToDo.length > 0 && (
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                  <span>✅</span> 해야 할 것
                </h4>
                <ul className="space-y-2">
                  {data.thingsToDo.map((item, i) => (
                    <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.thingsToAvoid && data.thingsToAvoid.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                  <span>❌</span> 피해야 할 것
                </h4>
                <ul className="space-y-2">
                  {data.thingsToAvoid.map((item, i) => (
                    <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Advice */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <SectionTitle icon="💡" title="맞춤 조언" />
          <div className="space-y-3">
            {data.advice.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next Message Suggestions */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <SectionTitle icon="✉️" title="추천 메시지" />
          <div className="space-y-4">
            {data.nextMessageSuggestions.map((suggestion, i) => {
              const isDetailed = typeof suggestion === 'object';
              const msg = isDetailed ? suggestion.message : suggestion;

              return (
                <div
                  key={i}
                  className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => {
                    navigator.clipboard.writeText(msg);
                    alert('메시지가 복사되었습니다!');
                  }}
                >
                  <p className="text-gray-800 font-medium mb-2">{msg}</p>
                  {isDetailed && (
                    <div className="space-y-1 mt-3 pt-3 border-t border-pink-200">
                      <p className="text-xs text-gray-500"><b>타이밍:</b> {suggestion.context}</p>
                      <p className="text-xs text-gray-500"><b>예상 반응:</b> {suggestion.expectedReaction}</p>
                      <p className="text-xs text-gray-500"><b>후속 대응:</b> {suggestion.followUp}</p>
                    </div>
                  )}
                  <p className="text-xs text-pink-400 mt-2">탭하여 복사</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Strategy */}
        {data.dateStrategy && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <SectionTitle icon="📅" title="만남 전략" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">만남 제안 적절성:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  data.dateStrategy.readiness.includes('적기') ? 'bg-green-100 text-green-700' :
                  data.dateStrategy.readiness.includes('늦음') ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {data.dateStrategy.readiness}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 font-medium">이상적인 타이밍</span>
                <p className="text-gray-700 mt-1">{data.dateStrategy.idealTiming}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 font-medium">추천 데이트</span>
                <p className="text-gray-700 mt-1">{data.dateStrategy.suggestedActivity}</p>
              </div>
              {data.dateStrategy.approachScript && (
                <div className="p-4 bg-purple-50 rounded-xl">
                  <span className="text-sm text-purple-700 font-medium">만남 제안 예시</span>
                  <p className="text-gray-700 mt-2 whitespace-pre-line text-sm">{data.dateStrategy.approachScript}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Roadmap */}
        {data.roadmap && data.roadmap.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <SectionTitle icon="🗺️" title="공략 로드맵" />
            <div className="space-y-4">
              {data.roadmap.map((item, i) => (
                <div key={i} className="relative pl-8 pb-6 border-l-2 border-pink-200 last:border-0 last:pb-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                  <div className="font-bold text-pink-600 mb-1">{item.period}</div>
                  <div className="text-gray-800 font-medium mb-2">{item.goal}</div>
                  <ul className="space-y-1 mb-2">
                    {item.actions.map((action, j) => (
                      <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-pink-400">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                  {item.successIndicator && (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                      성공 지표: {item.successIndicator}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* AI Coach CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/chat/${id}`}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all"
          >
            <span className="text-xl">💬</span>
            AI 연애 코치에게 상담하기
            <span className="text-sm opacity-80">(100회 무료)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
