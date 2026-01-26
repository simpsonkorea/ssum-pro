import { NextRequest, NextResponse } from 'next/server';

const TOSS_SECRET_KEY = 'test_gsk_EP59LybZ8B9KDpzjPwbZr6GYo7pR';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=payment_invalid`);
  }

  try {
    // 결제 승인 요청
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Payment confirmation failed:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=payment_failed`);
    }

    const paymentResult = await response.json();
    console.log('Payment confirmed:', paymentResult);

    // TODO: Save payment info to Supabase
    // await supabaseAdmin.from('payments').insert({
    //   payment_key: paymentKey,
    //   order_id: orderId,
    //   amount: Number(amount),
    //   status: 'DONE',
    // });

    // Redirect to upload page with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=success`);

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=payment_error`);
  }
}
