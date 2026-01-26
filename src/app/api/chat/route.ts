import { NextRequest, NextResponse } from 'next/server';
import { chatWithCoach } from '@/lib/gemini';

const MAX_CHAT_USAGE = 100;

export async function POST(request: NextRequest) {
  try {
    const { messages, analysisContext, reportId, currentUsage } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: '메시지가 없습니다.' },
        { status: 400 }
      );
    }

    // 사용량 체크
    if (currentUsage >= MAX_CHAT_USAGE) {
      return NextResponse.json(
        { error: '상담 횟수가 모두 소진되었습니다. (100회 제한)' },
        { status: 403 }
      );
    }

    // AI 코치 응답 생성
    const response = await chatWithCoach(
      messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      })),
      analysisContext || ''
    );

    // TODO: Supabase에서 사용량 업데이트
    // await supabaseAdmin
    //   .from('reports')
    //   .update({ chat_usage: currentUsage + 1 })
    //   .eq('id', reportId);

    return NextResponse.json({
      message: response,
      usage: currentUsage + 1,
      remaining: MAX_CHAT_USAGE - currentUsage - 1,
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
