/**
 * In-memory SMS verification code store
 *
 * Rules:
 * - Code expires after 3 minutes
 * - Max 5 attempts per code
 * - Max 5 codes per phone per day
 * - Must wait 30 seconds between sends
 */

export type VerificationPurpose = 'signup' | 'reset';

export interface VerificationEntry {
  phone: string;
  code: string;
  purpose: VerificationPurpose;
  expiresAt: Date;
  attempts: number;  // wrong attempts count
  createdAt: Date;
}

interface DailyCount {
  date: string;  // YYYY-MM-DD
  count: number;
}

interface VerifiedEntry {
  phone: string;
  purpose: VerificationPurpose;
  token: string;
  expiresAt: Date;
}

// Store: Map<phone_purpose, VerificationEntry>
const verificationStore: Map<string, VerificationEntry> = new Map();

// Daily send counts: Map<phone, DailyCount>
const dailyCountStore: Map<string, DailyCount> = new Map();

// Verified tokens: Map<token, VerifiedEntry>
const verifiedStore: Map<string, VerifiedEntry> = new Map();

// Constants
const CODE_EXPIRY_MS = 3 * 60 * 1000;  // 3 minutes
const MAX_ATTEMPTS = 5;
const MAX_DAILY_SENDS = 5;
const COOLDOWN_SECONDS = 30;
const VERIFIED_TOKEN_EXPIRY_MS = 10 * 60 * 1000;  // 10 minutes for using token

/**
 * Generate a key for the verification store
 */
function getStoreKey(phone: string, purpose: VerificationPurpose): string {
  return `${phone}_${purpose}`;
}

/**
 * Generate a random 6-digit code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random verification token
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get daily send count for a phone number
 */
export function getDailyCount(phone: string): number {
  const entry = dailyCountStore.get(phone);
  if (!entry) return 0;

  // Reset if it's a new day
  if (entry.date !== getTodayString()) {
    dailyCountStore.delete(phone);
    return 0;
  }

  return entry.count;
}

/**
 * Increment daily send count
 */
function incrementDailyCount(phone: string): void {
  const today = getTodayString();
  const entry = dailyCountStore.get(phone);

  if (!entry || entry.date !== today) {
    dailyCountStore.set(phone, { date: today, count: 1 });
  } else {
    entry.count++;
    dailyCountStore.set(phone, entry);
  }
}

/**
 * Check if user can send a new verification code
 */
export function canSendCode(phone: string, purpose: VerificationPurpose): {
  allowed: boolean;
  retryAfterSeconds?: number;
  error?: string;
} {
  // Check daily limit
  const dailyCount = getDailyCount(phone);
  if (dailyCount >= MAX_DAILY_SENDS) {
    return {
      allowed: false,
      error: '일일 인증번호 발송 한도(5회)를 초과했습니다. 내일 다시 시도해주세요.',
    };
  }

  // Check cooldown (30 seconds between sends)
  const key = getStoreKey(phone, purpose);
  const existing = verificationStore.get(key);

  if (existing) {
    const elapsedSeconds = (Date.now() - existing.createdAt.getTime()) / 1000;
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

/**
 * Create a new verification code
 */
export function createVerificationCode(phone: string, purpose: VerificationPurpose): string {
  const key = getStoreKey(phone, purpose);
  const code = generateCode();

  const entry: VerificationEntry = {
    phone,
    code,
    purpose,
    expiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
    attempts: 0,
    createdAt: new Date(),
  };

  verificationStore.set(key, entry);
  incrementDailyCount(phone);

  console.log(`[SMS Store] Created code for ${phone} (${purpose}): ${code}`);

  return code;
}

/**
 * Verify a code and return result
 */
export function verifyCode(
  phone: string,
  purpose: VerificationPurpose,
  code: string
): {
  success: boolean;
  error?: string;
  verificationToken?: string;
} {
  const key = getStoreKey(phone, purpose);
  const entry = verificationStore.get(key);

  // Check if code exists
  if (!entry) {
    return {
      success: false,
      error: '인증번호가 존재하지 않습니다. 인증번호를 다시 요청해주세요.',
    };
  }

  // Check if code is expired
  if (new Date() > entry.expiresAt) {
    verificationStore.delete(key);
    return {
      success: false,
      error: '인증번호가 만료되었습니다. 인증번호를 다시 요청해주세요.',
    };
  }

  // Check attempts limit
  if (entry.attempts >= MAX_ATTEMPTS) {
    verificationStore.delete(key);
    return {
      success: false,
      error: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.',
    };
  }

  // Verify code
  if (entry.code !== code) {
    entry.attempts++;
    verificationStore.set(key, entry);

    const remainingAttempts = MAX_ATTEMPTS - entry.attempts;
    return {
      success: false,
      error: `인증번호가 일치하지 않습니다. (남은 시도: ${remainingAttempts}회)`,
    };
  }

  // Success - delete the verification entry and create a verified token
  verificationStore.delete(key);

  const token = generateToken();
  const verifiedEntry: VerifiedEntry = {
    phone,
    purpose,
    token,
    expiresAt: new Date(Date.now() + VERIFIED_TOKEN_EXPIRY_MS),
  };
  verifiedStore.set(token, verifiedEntry);

  console.log(`[SMS Store] Code verified for ${phone} (${purpose}), token: ${token.substring(0, 8)}...`);

  return {
    success: true,
    verificationToken: token,
  };
}

/**
 * Check if a verification token is valid
 */
export function isVerificationTokenValid(
  token: string,
  phone: string,
  purpose: VerificationPurpose
): boolean {
  const entry = verifiedStore.get(token);

  if (!entry) {
    return false;
  }

  // Check expiry
  if (new Date() > entry.expiresAt) {
    verifiedStore.delete(token);
    return false;
  }

  // Check phone and purpose match
  if (entry.phone !== phone || entry.purpose !== purpose) {
    return false;
  }

  return true;
}

/**
 * Consume (invalidate) a verification token after use
 */
export function consumeVerificationToken(token: string): void {
  verifiedStore.delete(token);
}

/**
 * Get remaining time for a verification code (for debugging/UI)
 */
export function getRemainingTime(phone: string, purpose: VerificationPurpose): number | null {
  const key = getStoreKey(phone, purpose);
  const entry = verificationStore.get(key);

  if (!entry) return null;

  const remaining = entry.expiresAt.getTime() - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : null;
}

// Cleanup expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = new Date();

  // Clean up expired verification codes
  for (const [key, entry] of verificationStore.entries()) {
    if (now > entry.expiresAt) {
      verificationStore.delete(key);
    }
  }

  // Clean up expired tokens
  for (const [token, entry] of verifiedStore.entries()) {
    if (now > entry.expiresAt) {
      verifiedStore.delete(token);
    }
  }

  // Clean up old daily counts
  const today = getTodayString();
  for (const [phone, entry] of dailyCountStore.entries()) {
    if (entry.date !== today) {
      dailyCountStore.delete(phone);
    }
  }
}, 5 * 60 * 1000);
