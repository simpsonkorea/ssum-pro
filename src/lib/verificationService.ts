import { supabaseAdmin } from './supabase';
import { nanoid } from 'nanoid';

const CODE_EXPIRY_MINUTES = 3;
const MAX_DAILY_CODES = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 5;

export async function canSendCode(phone: string): Promise<{ allowed: boolean; retryAfterSeconds?: number; error?: string }> {
  // Check daily limit
  const { data: countData } = await supabaseAdmin
    .rpc('get_daily_verification_count', { p_phone: phone });

  if (countData >= MAX_DAILY_CODES) {
    return { allowed: false, error: '오늘 인증번호 발송 한도(5회)를 초과했습니다.' };
  }

  // Check cooldown
  const { data: lastCode } = await supabaseAdmin
    .from('verification_codes')
    .select('created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastCode) {
    const lastSent = new Date(lastCode.created_at);
    const secondsSince = (Date.now() - lastSent.getTime()) / 1000;
    if (secondsSince < RESEND_COOLDOWN_SECONDS) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince)
      };
    }
  }

  return { allowed: true };
}

export async function createVerificationCode(phone: string, purpose: 'signup' | 'reset'): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await supabaseAdmin
    .from('verification_codes')
    .insert({
      phone,
      code,
      purpose,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      verified: false,
    });

  return code;
}

export async function verifyCode(phone: string, purpose: 'signup' | 'reset', code: string): Promise<{ success: boolean; verificationToken?: string; error?: string }> {
  const { data: entry, error } = await supabaseAdmin
    .from('verification_codes')
    .select('*')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !entry) {
    return { success: false, error: '인증번호를 먼저 요청해주세요.' };
  }

  if (new Date(entry.expires_at) < new Date()) {
    return { success: false, error: '인증번호가 만료되었습니다. 다시 요청해주세요.' };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' };
  }

  if (entry.code !== code) {
    await supabaseAdmin
      .from('verification_codes')
      .update({ attempts: entry.attempts + 1 })
      .eq('id', entry.id);

    return { success: false, error: '인증번호가 일치하지 않습니다.' };
  }

  // Success - mark as verified and generate token
  const verificationToken = nanoid(32);
  await supabaseAdmin
    .from('verification_codes')
    .update({ verified: true, verification_token: verificationToken })
    .eq('id', entry.id);

  return { success: true, verificationToken };
}

export async function validateVerificationToken(phone: string, purpose: 'signup' | 'reset', token: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('verification_codes')
    .select('*')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('verification_token', token)
    .eq('verified', true)
    .single();

  return !!data;
}

export async function clearVerificationToken(phone: string, purpose: 'signup' | 'reset'): Promise<void> {
  await supabaseAdmin
    .from('verification_codes')
    .delete()
    .eq('phone', phone)
    .eq('purpose', purpose);
}
