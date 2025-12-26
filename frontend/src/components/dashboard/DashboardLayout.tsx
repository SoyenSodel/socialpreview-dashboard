import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface MobileMenuContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within DashboardLayout');
  }
  return context;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div
      className="w-full bg-black relative overflow-hidden"
      style={{ minHeight: '100dvh', height: '100dvh' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_0%,transparent_65%)]" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <nav className="relative z-10 border-b border-zinc-900">
        <div className="bg-zinc-950/80 backdrop-blur-xl">
          <div className="max-w-full mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <h1 className="text-xl sm:text-2xl font-bold text-white">SocialPreview</h1>
                <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-zinc-900 text-sm text-gray-400">
                  {user?.role === 'management' ? 'Management' : user?.role === 'team' ? t('dashboard.teamMember') : t('dashboard.client')}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 bg-zinc-900 rounded-lg p-1">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2 sm:px-3 py-1.5 rounded text-sm font-medium transition-colors ${language === 'en'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLanguage('cs')}
                    className={`px-2 sm:px-3 py-1.5 rounded text-sm font-medium transition-colors ${language === 'cs'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    CZ
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-lg">
                  {user?.profile_picture && (
                    <img
                      src={user.profile_picture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-zinc-700"
                    />
                  )}
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="px-3 sm:px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">{t('dashboard.logout')}</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <MobileMenuContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen }}>
          {children}
        </MobileMenuContext.Provider>
      </main>
    </div>
  );
};
