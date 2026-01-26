'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

type SignupStep = 'phone' | 'code' | 'name' | 'birthyear' | 'gender' | 'password';

interface FormData {
  phone: string;
  verificationCode: string;
  verificationToken: string;
  name: string;
  birthyear: string;
  gender: 'male' | 'female' | '';
  password: string;
  confirmPassword: string;
}

interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasSpecial: boolean;
  matches: boolean;
}

const SIGNUP_STEPS: SignupStep[] = ['phone', 'code', 'name', 'birthyear', 'gender', 'password'];

export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState<SignupStep>('phone');
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

  const [formData, setFormData] = useState<FormData>({
    phone: '',
    verificationCode: '',
    verificationToken: '',
    name: '',
    birthyear: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });

  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const birthyearInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusDelay = setTimeout(() => {
      switch (signupStep) {
        case 'phone':
          phoneInputRef.current?.focus();
          break;
        case 'code':
          codeInputRef.current?.focus();
          break;
        case 'name':
          nameInputRef.current?.focus();
          break;
        case 'birthyear':
          birthyearInputRef.current?.focus();
          break;
        case 'password':
          passwordInputRef.current?.focus();
          break;
      }
    }, 300);
    return () => clearTimeout(focusDelay);
  }, [signupStep]);

  useEffect(() => {
    if (signupStep !== 'code') return;

    if ('OTPCredential' in window) {
      const ac = new AbortController();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator.credentials as any).get({
        otp: { transport: ['sms'] },
        signal: ac.signal,
      }).then((otp: { code?: string } | null) => {
        if (otp && 'code' in otp && otp.code) {
          setFormData(prev => ({ ...prev, verificationCode: otp.code! }));
        }
      }).catch(() => {});

      return () => ac.abort();
    }
  }, [signupStep]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    if (field === 'birthyear') {
      value = value.replace(/[^\d]/g, '').slice(0, 4);
    }
    if (field === 'verificationCode') {
      value = value.replace(/[^\d]/g, '').slice(0, 6);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const passwordValidation: PasswordValidation = useMemo(() => ({
    minLength: formData.password.length >= 8,
    hasNumber: /\d/.test(formData.password),
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    matches: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
  }), [formData.password, formData.confirmPassword]);

  const isPasswordValid = useMemo(() => {
    return passwordValidation.minLength &&
      passwordValidation.hasNumber &&
      passwordValidation.hasUppercase &&
      passwordValidation.hasLowercase &&
      passwordValidation.hasSpecial;
  }, [passwordValidation]);

  const isPhoneValid = useMemo(() => {
    return formData.phone.replace(/-/g, '').length >= 10;
  }, [formData.phone]);

  const currentStepIndex = SIGNUP_STEPS.indexOf(signupStep);

  const goToStep = useCallback((step: SignupStep, direction: 'forward' | 'backward' = 'forward') => {
    setSlideDirection(direction);
    setError(null);
    setSignupStep(step);
  }, []);

  const goBack = useCallback(() => {
    const currentIndex = SIGNUP_STEPS.indexOf(signupStep);
    if (currentIndex > 0) {
      if (signupStep === 'name') {
        goToStep('phone', 'backward');
      } else {
        goToStep(SIGNUP_STEPS[currentIndex - 1], 'backward');
      }
    }
  }, [signupStep, goToStep]);

  const handleSendCode = useCallback(async () => {
    if (!isPhoneValid || isSendingCode) return;

    setIsSendingCode(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone.replace(/-/g, ''),
          purpose: 'signup',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증번호 발송 중 오류가 발생했습니다.');
      }

      setCountdown(180);
      setResendCooldown(30);
      setFormData(prev => ({ ...prev, verificationCode: '' }));
      goToStep('code', 'forward');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingCode(false);
    }
  }, [isPhoneValid, isSendingCode, formData.phone, goToStep]);

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0 || isSendingCode) return;

    setIsSendingCode(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone.replace(/-/g, ''),
          purpose: 'signup',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증번호 발송 중 오류가 발생했습니다.');
      }

      setCountdown(180);
      setResendCooldown(30);
      setFormData(prev => ({ ...prev, verificationCode: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingCode(false);
    }
  }, [resendCooldown, isSendingCode, formData.phone]);

  const handleVerifyCode = useCallback(async () => {
    if (formData.verificationCode.length !== 6 || isVerifyingCode) return;

    setIsVerifyingCode(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone.replace(/-/g, ''),
          code: formData.verificationCode,
          purpose: 'signup',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증 확인 중 오류가 발생했습니다.');
      }

      setFormData(prev => ({ ...prev, verificationToken: data.verificationToken }));
      setCountdown(0);
      goToStep('name', 'forward');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 확인 중 오류가 발생했습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  }, [formData.verificationCode, formData.phone, isVerifyingCode, goToStep]);

  const handleSignup = async () => {
    if (!formData.verificationToken || !isPasswordValid || !passwordValidation.matches) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone.replace(/-/g, ''),
          birthyear: formData.birthyear,
          gender: formData.gender,
          password: formData.password,
          verificationToken: formData.verificationToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입 중 오류가 발생했습니다.');
      }

      window.location.href = '/?login=success';
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
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

  const ProgressIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {SIGNUP_STEPS.map((step, index) => (
        <div
          key={step}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            index < currentStepIndex
              ? 'bg-pink-500'
              : index === currentStepIndex
              ? 'bg-pink-500 w-4'
              : 'bg-gray-200'
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-gray-400">
        {currentStepIndex + 1}/{SIGNUP_STEPS.length}
      </span>
    </div>
  );

  const BackButton = () => (
    <button
      type="button"
      onClick={goBack}
      className="absolute left-0 top-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );

  const StepContainer = ({ children, showBack = true }: { children: React.ReactNode; showBack?: boolean }) => (
    <div className={`relative transition-all duration-300 ease-out ${
      slideDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'
    }`}>
      {showBack && currentStepIndex > 0 && <BackButton />}
      <div className={showBack && currentStepIndex > 0 ? 'pt-8' : ''}>
        {children}
      </div>
    </div>
  );

  const renderSignupStep = () => {
    switch (signupStep) {
      case 'phone':
        return (
          <StepContainer showBack={false}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">전화번호를 알려주세요</h2>
              <p className="text-gray-500">본인 인증을 위해 사용됩니다</p>
            </div>

            <div className="mb-6">
              <input
                ref={phoneInputRef}
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="010-1234-5678"
                autoComplete="tel"
                className="w-full px-6 py-4 text-xl text-center border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={!isPhoneValid || isSendingCode}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingCode ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  발송 중...
                </span>
              ) : (
                '인증번호 받기'
              )}
            </button>
          </StepContainer>
        );

      case 'code':
        return (
          <StepContainer>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">인증번호를 입력해주세요</h2>
              <p className="text-gray-500">
                {formData.phone}으로 발송된 6자리 숫자
              </p>
              {countdown > 0 && (
                <p className="text-pink-500 font-medium mt-1">
                  남은 시간: {formatCountdown(countdown)}
                </p>
              )}
            </div>

            <div className="mb-4">
              <input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={formData.verificationCode}
                onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full px-6 py-4 text-3xl text-center tracking-[0.5em] border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all font-mono"
              />
            </div>

            <div className="text-center mb-6">
              {resendCooldown > 0 ? (
                <span className="text-xs text-gray-300">
                  {resendCooldown}초 후 재발송 가능
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  인증번호가 오지 않나요?
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={formData.verificationCode.length !== 6 || isVerifyingCode || countdown === 0}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifyingCode ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  확인 중...
                </span>
              ) : countdown === 0 ? (
                '시간 만료 - 다시 요청하세요'
              ) : (
                '확인'
              )}
            </button>
          </StepContainer>
        );

      case 'name':
        return (
          <StepContainer>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">이름을 알려주세요</h2>
              <p className="text-gray-500">실명으로 입력해주세요</p>
            </div>

            <div className="mb-6">
              <input
                ref={nameInputRef}
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
                className="w-full px-6 py-4 text-xl text-center border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => goToStep('birthyear', 'forward')}
              disabled={formData.name.trim().length === 0}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </StepContainer>
        );

      case 'birthyear':
        return (
          <StepContainer>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">출생연도를 알려주세요</h2>
              <p className="text-gray-500">4자리 숫자로 입력해주세요</p>
            </div>

            <div className="mb-6">
              <input
                ref={birthyearInputRef}
                type="text"
                inputMode="numeric"
                value={formData.birthyear}
                onChange={(e) => handleInputChange('birthyear', e.target.value)}
                placeholder="예: 1990"
                maxLength={4}
                className="w-full px-6 py-4 text-3xl text-center border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => goToStep('gender', 'forward')}
              disabled={formData.birthyear.length !== 4}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </StepContainer>
        );

      case 'gender':
        return (
          <StepContainer>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">성별을 선택해주세요</h2>
              <p className="text-gray-500">분석에 활용됩니다</p>
            </div>

            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                className={`flex-1 py-6 text-xl font-medium rounded-2xl border-2 transition-all ${
                  formData.gender === 'male'
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                남성
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                className={`flex-1 py-6 text-xl font-medium rounded-2xl border-2 transition-all ${
                  formData.gender === 'female'
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                여성
              </button>
            </div>

            <button
              type="button"
              onClick={() => goToStep('password', 'forward')}
              disabled={formData.gender === ''}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </StepContainer>
        );

      case 'password':
        return (
          <StepContainer>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">비밀번호를 설정해주세요</h2>
              <p className="text-gray-500">안전한 비밀번호를 만들어주세요</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="비밀번호"
                  autoComplete="new-password"
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="비밀번호 확인"
                  autoComplete="new-password"
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>

              {formData.password.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                  <ValidationItem valid={passwordValidation.minLength} text="8자 이상" />
                  <ValidationItem valid={passwordValidation.hasNumber} text="숫자 포함" />
                  <ValidationItem valid={passwordValidation.hasUppercase} text="대문자 포함" />
                  <ValidationItem valid={passwordValidation.hasLowercase} text="소문자 포함" />
                  <ValidationItem valid={passwordValidation.hasSpecial} text="특수문자 포함" />
                  {formData.confirmPassword.length > 0 && (
                    <ValidationItem
                      valid={passwordValidation.matches}
                      text={passwordValidation.matches ? '비밀번호 일치' : '비밀번호 불일치'}
                    />
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignup}
              disabled={!isPasswordValid || !passwordValidation.matches || isSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  처리 중...
                </span>
              ) : (
                '가입 완료'
              )}
            </button>
          </StepContainer>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-pink-500 mb-2">읽씹당했나</h1>
          </Link>
          <p className="text-gray-500 text-sm">휴대폰으로 회원가입</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <ProgressIndicator />
        {renderSignupStep()}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-3">
            이미 계정이 있으신가요?
          </p>
          <Link
            href="/signin"
            className="block w-full py-3 text-center border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            휴대폰으로 로그인하기
          </Link>
        </div>

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
