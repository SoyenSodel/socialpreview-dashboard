import { type FormEvent, useState } from 'react';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { useLanguage } from '../contexts/LanguageContext';
import { Input } from './ui';
import { Button } from './ui';
import { LanguageSwitcher } from './ui';
import OurLogo from '../assets/logo.webp';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export default function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const { isLoading, error, successMessage, requestReset } = usePasswordReset();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await requestReset(email);


  };

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
                {t('forgot.title')}
              </h1>
              <p className="text-gray-500 text-sm">
                {t('forgot.subtitle')}
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-accent-green/10 border border-accent-green/30 rounded-lg backdrop-blur-sm animate-fade-in">
                <p className="text-accent-green text-sm text-center">{t('forgot.successMessage')}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm animate-fade-in">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {!successMessage && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  label={t('forgot.email')}
                  placeholder={t('forgot.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full"
                >
                  {t('forgot.sendLink')}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-gray-500 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                {t('forgot.backToLogin')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
