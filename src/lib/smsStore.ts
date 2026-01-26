import { supabaseAdmin } from './supabase';

export type VerificationPurpose = 'signup' | 'reset';

const CODE_EXPIRY_MS = 3 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_DAILY_SENDS = 5;
const COOLDOWN_SECONDS = 30;
const VERIFIED_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function getDailyCount(phone: string): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { count, error } = await supabaseAdmin
    .from('verification_codes')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', twentyFourHoursAgo);

  if (error) {
    console.error('[SMS Store] getDailyCount error:', error);
    return 0;
  }

  return count || 0;
}

export async function canSendCode(phone: string, purpose: VerificationPurpose): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
  error?: string;
}> {
  const dailyCount = await getDailyCount(phone);
  if (dailyCount >= MAX_DAILY_SENDS) {
    return {
      allowed: false,
      error: '일일 인증번호 발송 한도(5회)를 초과했습니다. 내일 다시 시도해주세요.',
    };
  }

  const cooldownTime = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();
  
  const { data: recentCode } = await supabaseAdmin
    .from('verification_codes')
    .select('created_at')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .gte('created_at', cooldownTime)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentCode) {
    const createdAt = new Date(recentCode.created_at).getTime();
    const elapsedSeconds = (Date.now() - createdAt) / 1000;
    const remainingSeconds = Math.ceil(COOLDOWN_SECONDS - elapsedSeconds);

    if (remainingSeconds > 0) {
      return {
        allowed: false,
        retryAfterSeconds: remainingSeconds,
        error: `${remainingSeconds}초 후에 다시 시도해주세요.`,
      };
    }
  }

  return { allowed: true };
}

export async function createVerificationCode(phone: string, purpose: VerificationPurpose): Promise<string> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS).toISOString();

  await supabaseAdmin
    .from('verification_codes')
    .delete()
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('verified', false);

  const { error } = await supabaseAdmin
    .from('verification_codes')
    .insert({
      phone,
      code,
      purpose,
      expires_at: expiresAt,
      attempts: 0,
      verified: false,
    });

  if (error) {
    console.error('[SMS Store] createVerificationCode error:', error);
    throw new Error('인증번호 생성에 실패했습니다.');
  }

  console.log(`[SMS Store] Created code for ${phone} (${purpose}): ${code}`);
  return code;
}

export async function verifyCode(
  phone: string,
  purpose: VerificationPurpose,
  code: string
): Promise<{
  success: boolean;
  error?: string;
  verificationToken?: string;
}> {
  const { data: entry, error: fetchError } = await supabaseAdmin
    .from('verification_codes')
    .select('*')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !entry) {
    return {
      success: false,
      error: '인증번호가 존재하지 않습니다. 인증번호를 다시 요청해주세요.',
    };
  }

  if (new Date() > new Date(entry.expires_at)) {
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('id', entry.id);

    return {
      success: false,
      error: '인증번호가 만료되었습니다. 인증번호를 다시 요청해주세요.',
    };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('id', entry.id);

    return {
      success: false,
      error: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.',
    };
  }

  if (entry.code !== code) {
    await supabaseAdmin
      .from('verification_codes')
      .update({ attempts: entry.attempts + 1 })
      .eq('id', entry.id);

    const remainingAttempts = MAX_ATTEMPTS - (entry.attempts + 1);
    return {
      success: false,
      error: `인증번호가 일치하지 않습니다. (남은 시도: ${remainingAttempts}회)`,
    };
  }

  const token = generateToken();
  const tokenExpiresAt = new Date(Date.now() + VERIFIED_TOKEN_EXPIRY_MS).toISOString();

  await supabaseAdmin
    .from('verification_codes')
    .update({
      verified: true,
      verification_token: token,
      expires_at: tokenExpiresAt,
    })
    .eq('id', entry.id);

  console.log(`[SMS Store] Code verified for ${phone} (${purpose}), token: ${token.substring(0, 8)}...`);

  return {
    success: true,
    verificationToken: token,
  };
}

export async function isVerificationTokenValid(
  token: string,
  phone: string,
  purpose: VerificationPurpose
): Promise<boolean> {
  const { data: entry } = await supabaseAdmin
    .from('verification_codes')
    .select('*')
    .eq('verification_token', token)
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('verified', true)
    .single();

  if (!entry) {
    return false;
  }

  if (new Date() > new Date(entry.expires_at)) {
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('id', entry.id);
    return false;
  }

  return true;
}

export async function consumeVerificationToken(token: string): Promise<void> {
  await supabaseAdmin
    .from('verification_codes')
    .delete()
    .eq('verification_token', token);
}

export async function getRemainingTime(phone: string, purpose: VerificationPurpose): Promise<number | null> {
  const { data: entry } = await supabaseAdmin
    .from('verification_codes')
    .select('expires_at')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!entry) return null;

  const remaining = new Date(entry.expires_at).getTime() - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : null;
}
