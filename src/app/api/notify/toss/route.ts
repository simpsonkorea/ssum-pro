import { NextRequest, NextResponse } from 'next/server';
import { sendAnalysisCompleteNotification, sendTossNotification } from '@/lib/toss';

// Toss sendMessage: 알림 발송
export async function POST(request: NextRequest) {
  try {
    const {
      userKey,
      userName,
      reportId,
      type = 'analysis_complete',
      templateSetCode,
      context,
    } = await request.json();

    if (!userKey) {
      return NextResponse.json(
        { error: 'userKey가 필요해요' },
        { status: 400 }
      );
    }

    let result;

    // 타입별 알림 처리
    switch (type) {
      case 'analysis_complete':
        // 분석 완료 알림
        if (!reportId) {
          return NextResponse.json(
            { error: 'reportId가 필요해요' },
            { status: 400 }
          );
        }

        const appDeepLink = `intoss://chat-decoder/report/${reportId}`;
        result = await sendAnalysisCompleteNotification(
          userKey,
          userName || '회원',
          reportId,
          appDeepLink
        );
        break;

      case 'custom':
        // 커스텀 템플릿 알림
        if (!templateSetCode || !context) {
          return NextResponse.json(
            { error: 'templateSetCode와 context가 필요해요' },
            { status: 400 }
          );
        }

        result = await sendTossNotification(userKey, templateSetCode, context);
        break;

      default:
        return NextResponse.json(
          { error: `지원하지 않는 알림 타입: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Toss notification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 발송 중 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
