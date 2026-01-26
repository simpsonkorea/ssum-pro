import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  console.error('Payment failed:', { code, message });

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}?error=payment_failed&message=${encodeURIComponent(message || '결제에 실패했습니다')}`
  );
}
