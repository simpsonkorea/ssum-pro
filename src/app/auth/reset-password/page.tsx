'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Step = 'phone' | 'code' | 'password' | 'success';

interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasSpecial: boolean;
  matches: boolean;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Phone number formatting (010-1234-5678)
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhoneNumber(value));
    setError(null);
  };

  const handleCodeChange = (value: string) => {
    // Only allow numeric input, max 6 digits
    const numbers = value.replace(/[^\d]/g, '').slice(0, 6);
    setCode(numbers);
    setError(null);
  };

  // Password validation
  const passwordValidation: PasswordValidation = useMemo(() => ({
    minLength: newPassword.length >= 8,
    hasNumber: /\d/.test(newPassword),
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    matches: newPassword === confirmPassword && confirmPassword.length > 0,
  }), [newPassword, confirmPassword]);

  const isPasswordValid = useMemo(() => {
    return passwordValidation.minLength &&
      passwordValidation.hasNumber &&
      passwordValidation.hasUppercase &&
      passwordValidation.hasLowercase &&
      passwordValidation.hasSpecial &&
      passwordValidation.matches;
  }, [passwordValidation]);

  // Timer effect
  useEffect(() => {
    if (step !== 'code') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Resend cooldown effect
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }

    setCanResend(false);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Send verification code
  const handleSendCode = async () => {
    if (phone.replace(/-/g, '').length < 10) {
      setError('올바른 전화번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/-/g, ''),
          purpose: 'reset',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증번호 발송에 실패했습니다.');
      }

      setStep('code');
      setTimeRemaining(180);
      setResendCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend code
  const handleResendCode = useCallback(async () => {
    if (!canResend || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/-/g, ''),
          purpose: 'reset',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증번호 발송에 실패했습니다.');
      }

      setCode('');
      setTimeRemaining(180);
      setResendCooldown(30);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canResend, isSubmitting, phone]);

  // Step 2: Verify code
  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('6자리 인증번호를 입력해주세요.');
      return;
    }

    if (timeRemaining <= 0) {
      setError('인증 시간이 만료되었습니다. 다시 시도해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/-/g, ''),
          code,
          purpose: 'reset',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증에 실패했습니다.');
      }

      setVerificationToken(data.verificationToken);
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!isPasswordValid) {
      setError('비밀번호 조건을 모두 충족해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/-/g, ''),
          verificationToken,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '비밀번호 변경에 실패했습니다.');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${valid ? 'text-green-600' : 'text-gray-400'}`}>
      <span>{valid ? '✓' : '○'}</span>
      <span>{text}</span>
    </div>
  );

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-pink-500 mb-2">읽씹당했나</h1>
          </Link>
          <p className="text-gray-500 text-sm">비밀번호 재설정</p>
        </div>

        {/* Back Link */}
        {step !== 'success' && (
          <div className="mb-6">
            <Link
              href="/login"
              className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              로그인으로 돌아가기
            </Link>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Phone Input */}
        {step === 'phone' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">전화번호 인증</h2>
            <p className="text-gray-500 text-sm mb-6">
              가입하신 전화번호를 입력해주세요.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  autoComplete="tel"
                />
              </div>

              <button
                onClick={handleSendCode}
                disabled={phone.replace(/-/g, '').length < 10 || isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    처리 중...
                  </span>
                ) : (
                  '인증번호 발송'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Code Verification */}
        {step === 'code' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">인증번호 확인</h2>
            <p className="text-gray-500 text-sm mb-2">
              인증번호가 발송되었습니다.
            </p>
            <p className="text-pink-500 text-sm mb-6">
              {phone}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  인증번호 (6자리)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-center text-xl tracking-widest font-mono"
                    autoComplete="one-time-code"
                  />
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${
                    timeRemaining <= 30 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={code.length !== 6 || timeRemaining <= 0 || isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    확인 중...
                  </span>
                ) : (
                  '확인'
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResendCode}
                  disabled={!canResend || isSubmitting}
                  className={`text-sm ${
                    canResend
                      ? 'text-pink-500 hover:text-pink-600'
                      : 'text-gray-400 cursor-not-allowed'
                  } transition-colors`}
                >
                  {canResend
                    ? '인증번호가 오지 않나요? 재발송'
                    : `재발송 (${resendCooldown}초)`
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 'password' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">새 비밀번호 설정</h2>
            <p className="text-gray-500 text-sm mb-6">
              새로운 비밀번호를 입력해주세요.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                  placeholder="새 비밀번호를 입력하세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  autoComplete="new-password"
                />
                {/* Password Validation */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <ValidationItem valid={passwordValidation.minLength} text="8자 이상" />
                    <ValidationItem valid={passwordValidation.hasNumber} text="숫자 포함" />
                    <ValidationItem valid={passwordValidation.hasUppercase} text="대문자 포함" />
                    <ValidationItem valid={passwordValidation.hasLowercase} text="소문자 포함" />
                    <ValidationItem valid={passwordValidation.hasSpecial} text="특수문자 포함 (!@#$%^&* 등)" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  autoComplete="new-password"
                />
                {confirmPassword.length > 0 && (
                  <div className="mt-2">
                    <ValidationItem
                      valid={passwordValidation.matches}
                      text={passwordValidation.matches ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleResetPassword}
                disabled={!isPasswordValid || isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    변경 중...
                  </span>
                ) : (
                  '비밀번호 변경'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">비밀번호가 변경되었습니다</h2>
            <p className="text-gray-500 text-sm mb-6">
              새로운 비밀번호로 로그인해주세요.
            </p>

            <button
              onClick={() => router.push('/auth')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all"
            >
              로그인하기
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">
              이용약관
            </Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
