import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { useForm } from '../hooks/useForm';
import { getErrorMessage, validateEmail, validatePassword } from '../utils/validation';
import { loginUser } from '../utils/auth';
import type { LoginCredentials } from '../types';
import { Input } from './ui';
import { Button } from './ui';
import { LanguageSwitcher } from './ui';
import { useLanguage } from '../contexts/LanguageContext';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import OurLogo from '../assets/logo.webp'

export default function LoginScreen() {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { values, handleChange, handleBlur } = useForm<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
    totp_code: '',
  });

  const [showPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [requires2FA, setRequires2FA] = useState(false);

  if (showForgotPassword) {
    return <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});

    const errors: Record<string, string> = {};

    if (!requires2FA) {
      const emailError = validateEmail(values.email);
      const passwordError = validatePassword(values.password);

      if (emailError) errors.email = emailError;
      if (passwordError) errors.password = passwordError;
    } else {
      if (!values.totp_code || values.totp_code.length !== 6) {
        errors.totp_code = t('error.invalid2FACode');
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    const result = await loginUser(values);

    if (result.success && result.user) {
      // Token is handled via HttpOnly cookie now, so we pass an empty string
      login(result.user, '', values.rememberMe);
      navigate('/dashboard');
    } else if (result.requires_2fa) {
      setRequires2FA(true);
      setValidationErrors({ general: t('login.enter2FACode') });
    } else {
      setValidationErrors({ general: result.error || t('error.loginFailed') });
    }

    setIsLoading(false);
  };

  const emailError = getErrorMessage(validationErrors, 'email');
  const passwordError = getErrorMessage(validationErrors, 'password');
  const generalError = getErrorMessage(validationErrors);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a0a0a_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />

      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-xl shadow-2xl p-8 relative overflow-hidden">

          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <img
                  src={OurLogo}
                  alt="SocialPreview Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                {t('login.title')}
              </h1>
              <p className="text-gray-500 text-sm">
                {t('login.subtitle')}
              </p>
            </div>

            {generalError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm animate-fade-in">
                <p className="text-red-400 text-sm text-center">{generalError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="email"
                name="email"
                type="email"
                label={t('login.email')}
                placeholder={t('login.emailPlaceholder')}
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={emailError}
                autoComplete="email"
              />

              <div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label={t('login.password')}
                  placeholder={t('login.passwordPlaceholder')}
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={passwordError}
                  autoComplete="current-password"
                  disabled={requires2FA}
                />
              </div>

              {requires2FA && (
                <div className="animate-fade-in">
                  <Input
                    id="totp_code"
                    name="totp_code"
                    type="text"
                    label={t('login.2faCode')}
                    placeholder={t('login.2faCodePlaceholder')}
                    value={values.totp_code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={getErrorMessage(validationErrors, 'totp_code')}
                    autoComplete="one-time-code"
                    maxLength={6}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {t('login.2faCodeHint')}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={values.rememberMe}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${values.rememberMe
                        ? 'bg-white border-white'
                        : 'bg-zinc-950 border-zinc-800'
                      }`}>
                      <svg
                        className={`w-3 h-3 text-zinc-950 transition-opacity duration-200 ${values.rememberMe ? 'opacity-100' : 'opacity-0'
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {t('login.rememberMe')}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-gray-600 hover:text-accent-green transition-colors"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                {t('login.signIn')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {t('login.forgotPasswordText')}{' '}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-white hover:text-gray-300 transition-colors font-medium"
                >
                  {t('login.forgotPasswordButton')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
