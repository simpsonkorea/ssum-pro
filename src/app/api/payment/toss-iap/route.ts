import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyTossIapOrder } from '@/lib/toss';

// Toss IAP: 주문 검증
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: '주문 ID가 필요해요' },
        { status: 400 }
      );
    }

    // 세션에서 userKey 확인
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('toss_user');

    if (!userCookie) {
      return NextResponse.json(
        { error: '로그인이 필요해요' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userCookie.value);

    // IAP 주문 검증
    const verification = await verifyTossIapOrder(orderId, user.userKey);

    if (!verification.success) {
      return NextResponse.json(
        {
          error: '결제 검증에 실패했어요',
          status: verification.status,
          reason: verification.reason,
        },
        { status: 400 }
      );
    }

    // 결제 성공 - 구매 정보 저장 (세션에 추가)
    const updatedSession = {
      ...user,
      purchasedAt: new Date().toISOString(),
      orderId: verification.orderId,
      sku: verification.sku,
    };

    cookieStore.set('toss_user', JSON.stringify(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14,
    });

    return NextResponse.json({
      success: true,
      orderId: verification.orderId,
      sku: verification.sku,
      status: verification.status,
    });

  } catch (error) {
    console.error('Toss IAP verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 검증 중 오류가 발생했어요' },
      { status: 500 }
    );
  }
}

// 구매 상태 확인
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    const cookieStore = await cookies();
    const userCookie = cookieStore.get('toss_user');

    if (!userCookie) {
      return NextResponse.json(
        { error: '로그인이 필요해요' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userCookie.value);

    // 특정 주문 확인
    if (orderId) {
      const verification = await verifyTossIapOrder(orderId, user.userKey);
      return NextResponse.json({
        success: verification.success,
        orderId: verification.orderId,
        status: verification.status,
        sku: verification.sku,
      });
    }

    // 세션에 저장된 구매 정보 반환
    if (user.purchasedAt) {
      return NextResponse.json({
        success: true,
        purchased: true,
        orderId: user.orderId,
        sku: user.sku,
        purchasedAt: user.purchasedAt,
      });
    }

    return NextResponse.json({
      success: true,
      purchased: false,
    });

  } catch (error) {
    console.error('Toss IAP status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '구매 상태 확인 중 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
