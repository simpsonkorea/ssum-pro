import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversation } from '@/lib/gemini';
import { nanoid } from 'nanoid';
import { sendReportNotification } from '@/lib/solapi';
import { sendAnalysisCompleteNotification } from '@/lib/toss';

export async function POST(request: NextRequest) {
  try {
    const {
      conversation,
      myName,
      userId,
      userPhone,
      userName,
      platform = 'web', // 'web' | 'toss'
    } = await request.json();

    if (!conversation || conversation.trim().length === 0) {
      return NextResponse.json(
        { error: '대화 내용이 없어요' },
        { status: 400 }
      );
    }

    if (!myName) {
      return NextResponse.json(
        { error: '내 이름을 선택해주세요' },
        { status: 400 }
      );
    }

    // Gemini 분석 수행
    const analysisResult = await analyzeConversation(conversation, myName);

    // 리포트 ID 생성
    const reportId = nanoid(10);

    // TODO: Supabase에 저장 (Supabase 설정 후 활성화)
    // const { error } = await supabaseAdmin.from('reports').insert({
    //   id: reportId,
    //   user_id: userId,
    //   partner_name: extractPartnerName(conversation, myName),
    //   analysis_result: analysisResult,
    //   chat_usage: 0,
    //   max_chat_usage: 100,
    // });

    // 알림 발송 (플랫폼별)
    try {
      if (platform === 'toss' && userId) {
        // Toss: Push + Inbox 알림
        const appDeepLink = `intoss://chat-decoder/report/${reportId}`;
        await sendAnalysisCompleteNotification(
          userId,
          userName || '회원',
          reportId,
          appDeepLink
        );
        console.log(`[Toss] 분석 완료 알림 발송: ${userId}`);
      } else if (userPhone) {
        // Web: Solapi SMS/LMS 알림
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ssum-pro.vercel.app';
        await sendReportNotification(userPhone, userName || '회원', reportId, appUrl);
        console.log(`[Web] 분석 완료 SMS 발송: ${userPhone}`);
      }
    } catch (notifyError) {
      // 알림 실패해도 분석 결과는 반환
      console.error('알림 발송 실패:', notifyError);
    }

    return NextResponse.json({
      reportId,
      ...analysisResult,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '분석 중 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
