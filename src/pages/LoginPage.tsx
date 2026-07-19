import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Header } from '../components/layout/Header';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const dotGridStyle: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

type LoginMode = 'password' | 'magic';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<LoginMode>('password');

  // Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Magic link state
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState('');

  const { login, requestMagicLink } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      setLoginError(t('auth.fillAll'));
      return;
    }

    setLoginLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        const from =
          (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setLoginError(result.error ?? t('auth.invalidCredentials'));
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicError('');

    if (!magicEmail.trim()) {
      setMagicError(t('auth.magicLink.emailRequired'));
      return;
    }

    setMagicLoading(true);
    try {
      const result = await requestMagicLink(magicEmail.trim());
      if (result.success) {
        setMagicSent(true);
      } else {
        setMagicError(result.error ?? t('auth.magicLink.sendError'));
      }
    } finally {
      setMagicLoading(false);
    }
  };

  const switchToMagic = () => {
    setMode('magic');
    setMagicEmail(email);
    setLoginError('');
  };

  const switchToPassword = () => {
    setMode('password');
    setMagicError('');
    setMagicSent(false);
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
            <Sparkles className='w-7 h-7 text-emax-400' />
          </div>

          <h2 className='text-2xl sm:text-3xl font-extrabold text-white text-center mb-2'>
            {t('auth.signinTitle')}
          </h2>
          <p className='text-sm text-gray-400 text-center'>
            {mode === 'password' ? t('auth.loginDescription') : t('auth.magicLink.subtitle')}
          </p>

          <div className='w-full max-w-md mt-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl'>
            {mode === 'password' ? (
              <>
                <div className='flex items-center gap-2 mb-5'>
                  <Lock className='w-4 h-4 text-emax-400' />
                  <h3 className='text-sm font-semibold text-gray-300'>{t('auth.signin')}</h3>
                </div>

                <form className='space-y-4' onSubmit={handlePasswordSubmit}>
                  {loginError && (
                    <div
                      role='alert'
                      aria-live='assertive'
                      className='p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl'
                      id='login-error'
                    >
                      {loginError}
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor='login-email'
                      className='block text-sm font-medium text-gray-300 mb-1.5'
                    >
                      {t('auth.email')}
                    </label>
                    <input
                      id='login-email'
                      name='email'
                      type='email'
                      autoFocus
                      autoComplete='email'
                      aria-describedby={loginError ? 'login-error' : undefined}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors'
                      placeholder='name@company.com'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='login-password'
                      className='block text-sm font-medium text-gray-300 mb-1.5'
                    >
                      {t('auth.password')}
                    </label>
                    <div className='relative'>
                      <input
                        id='login-password'
                        name='password'
                        type={showPassword ? 'text' : 'password'}
                        autoComplete='current-password'
                        aria-describedby={loginError ? 'login-error' : undefined}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors'
                        placeholder='••••••••'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword((v) => !v)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors'
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className='w-4 h-4' />
                        ) : (
                          <Eye className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type='submit'
                    disabled={loginLoading}
                    className='w-full py-3 px-4 bg-emax-600 hover:bg-emax-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emax-600/25 hover:shadow-emax-500/30 transition-all duration-200 flex items-center justify-center gap-2'
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        {t('auth.signinLoading')}
                      </>
                    ) : (
                      <>
                        <KeyRound className='w-4 h-4' />
                        {t('auth.signinButton')}
                      </>
                    )}
                  </button>
                </form>

                {/* Secondary: password-free option */}
                <div className='mt-5 pt-5 border-t border-white/10 flex flex-col items-center gap-1'>
                  <span className='text-sm text-gray-500'>{t('auth.forgotPassword')}</span>
                  <button
                    type='button'
                    onClick={switchToMagic}
                    className='inline-flex items-center gap-1.5 text-sm text-emax-400 font-medium hover:text-emax-300 transition-colors py-1'
                  >
                    <Mail className='w-3.5 h-3.5' />
                    {t('auth.magicLink.switchToMagic')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className='flex items-center gap-2 mb-4'>
                  <Mail className='w-4 h-4 text-emax-400' />
                  <h3 className='text-sm font-semibold text-gray-300'>
                    {t('auth.magicLink.title')}
                  </h3>
                </div>

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
                  <form className='space-y-3' onSubmit={handleMagicLinkSubmit}>
                    {magicError && (
                      <div
                        role='alert'
                        aria-live='assertive'
                        className='p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl'
                      >
                        {magicError}
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor='magic-email'
                        className='block text-sm font-medium text-gray-300 mb-1.5'
                      >
                        {t('auth.magicLink.emailLabel')}
                      </label>
                      <input
                        id='magic-email'
                        name='magic-email'
                        type='email'
                        autoComplete='email'
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

                <div className='mt-5 rounded-2xl border border-emax-300/15 bg-emax-400/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'>
                  <div className='flex items-start gap-3'>
                    <span className='mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emax-300/15 text-emax-200 ring-1 ring-emax-200/20'>
                      <ShieldCheck className='h-4 w-4' />
                    </span>
                    <div className='space-y-1'>
                      <p className='text-sm font-semibold text-emax-50'>
                        {t('auth.magicLink.noticeTitle')}
                      </p>
                      <p className='text-xs leading-5 text-emax-50/70'>
                        {t('auth.magicLink.noticeBody')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back to password login */}
                <div className='mt-5 pt-5 border-t border-white/10'>
                  <button
                    type='button'
                    onClick={switchToPassword}
                    className='w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-2'
                  >
                    {t('auth.magicLink.switchToPassword')}
                  </button>
                </div>
              </>
            )}

            <div className='mt-5 text-center'>
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
