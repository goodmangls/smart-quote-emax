import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Header } from '../components/layout/Header';
import { LogIn, ArrowLeft, Mail } from 'lucide-react';

const dotGridStyle: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [magicMode, setMagicMode] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const { login, requestMagicLink } = useAuth();
  const { t, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail.trim()) return;
    setMagicLoading(true);
    try {
      await requestMagicLink(magicEmail.trim());
      setMagicSent(true);
    } finally {
      setMagicLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email.trim() && password.trim()) {
      setIsLoading(true);
      try {
        const result = await login(email.trim(), password.trim());
        if (result.success) {
          const savedLang = localStorage.getItem('smartQuoteLanguage');
          if (!savedLang && result.user?.nationality) {
            const natLangMap: Record<string, 'ko' | 'en'> = { KR: 'ko' };
            setLanguage(natLangMap[result.user.nationality] || 'en');
          }

          const defaultDest = '/admin';

          if (from === '/' || from === '/login' || from === '/dashboard') {
            navigate(defaultDest, { replace: true });
          } else {
            navigate(from, { replace: true });
          }
        } else {
          setError(result.error || t('auth.invalidCredentials'));
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setError(t('auth.fillAll'));
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
      <Header />

      <div className='relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black'>
        <div className='absolute inset-0 pointer-events-none' style={dotGridStyle} />
        <div className='absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-emax-600/20 blur-[120px] pointer-events-none' />
        <div className='absolute -bottom-40 -left-40 w-[300px] h-[300px] rounded-full bg-emax-500/15 blur-[100px] pointer-events-none' />

        <div className='relative flex flex-col items-center justify-center py-16 sm:py-24 px-4'>
          <Link
            to='/'
            className='inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            {t('auth.backHome')}
          </Link>

          <div className='w-14 h-14 rounded-2xl bg-emax-500/20 border border-emax-500/30 flex items-center justify-center mb-6'>
            <LogIn className='w-7 h-7 text-emax-400' />
          </div>

          <h2 className='text-2xl sm:text-3xl font-extrabold text-white text-center mb-2'>
            {t('auth.signinTitle')}
          </h2>
          <p className='text-sm text-gray-400 text-center'>{t('auth.systemName')}</p>

          <div className='w-full max-w-md mt-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl'>
            {!magicMode ? (
              <form className='space-y-5' onSubmit={handleSubmit}>
                {error && (
                  <div className='p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl'>
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor='email' className='block text-sm font-medium text-gray-300 mb-1.5'>
                    {t('auth.email')}
                  </label>
                  <input
                    id='email'
                    name='email'
                    type='email'
                    autoComplete='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors'
                    placeholder='name@company.com'
                  />
                </div>

                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-gray-300 mb-1.5'
                  >
                    {t('auth.password')}
                  </label>
                  <input
                    id='password'
                    name='password'
                    type='password'
                    autoComplete='current-password'
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors'
                  />
                </div>

                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full py-3 px-4 bg-emax-600 hover:bg-emax-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emax-600/25 hover:shadow-emax-500/30 transition-all duration-200'
                >
                  {t('auth.signin')}
                </button>

                <div className='flex items-center gap-3'>
                  <div className='flex-1 h-px bg-white/10' />
                  <span className='text-xs text-gray-500'>{t('auth.magicLink.orUseLink')}</span>
                  <div className='flex-1 h-px bg-white/10' />
                </div>

                <button
                  type='button'
                  onClick={() => setMagicMode(true)}
                  className='w-full py-3 px-4 bg-transparent border border-white/15 hover:border-white/30 text-gray-300 hover:text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2'
                >
                  <Mail className='w-4 h-4' />
                  {t('auth.magicLink.switchToMagic')}
                </button>
              </form>
            ) : (
              <div className='space-y-5'>
                {magicSent ? (
                  <div className='text-center py-4'>
                    <div className='w-12 h-12 rounded-full bg-emax-500/20 border border-emax-500/30 flex items-center justify-center mx-auto mb-4'>
                      <Mail className='w-6 h-6 text-emax-400' />
                    </div>
                    <p className='text-white font-semibold mb-1'>{t('auth.magicLink.sentTitle')}</p>
                    <p className='text-sm text-gray-400'>{t('auth.magicLink.sentDesc')}</p>
                    <button
                      type='button'
                      onClick={() => {
                        setMagicSent(false);
                        setMagicLoading(false);
                      }}
                      className='mt-4 text-sm text-emax-400 hover:text-emax-300 transition-colors'
                    >
                      {t('auth.magicLink.resend')}
                    </button>
                  </div>
                ) : (
                  <form className='space-y-5' onSubmit={handleMagicLinkSubmit}>
                    <div>
                      <label
                        htmlFor='magic-email'
                        className='block text-sm font-medium text-gray-300 mb-1.5'
                      >
                        {t('auth.email')}
                      </label>
                      <input
                        id='magic-email'
                        name='email'
                        type='email'
                        autoComplete='email'
                        required
                        value={magicEmail}
                        onChange={(e) => setMagicEmail(e.target.value)}
                        className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors'
                        placeholder='name@company.com'
                      />
                    </div>

                    <button
                      type='submit'
                      disabled={magicLoading}
                      className='w-full py-3 px-4 bg-emax-600 hover:bg-emax-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emax-600/25 hover:shadow-emax-500/30 transition-all duration-200 flex items-center justify-center gap-2'
                    >
                      <Mail className='w-4 h-4' />
                      {magicLoading ? t('auth.magicLink.sending') : t('auth.magicLink.sendButton')}
                    </button>
                  </form>
                )}

                <button
                  type='button'
                  onClick={() => {
                    setMagicMode(false);
                    setMagicSent(false);
                    setMagicEmail('');
                  }}
                  className='w-full text-sm text-gray-500 hover:text-gray-300 transition-colors'
                >
                  {t('auth.magicLink.switchToPassword')}
                </button>
              </div>
            )}

            <div className='mt-6 pt-5 border-t border-white/10 text-center'>
              <p className='text-sm text-gray-400'>
                {t('auth.noAccount')}{' '}
                <Link
                  to='/signup'
                  className='font-semibold text-emax-400 hover:text-emax-300 transition-colors'
                >
                  {t('auth.signup')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
