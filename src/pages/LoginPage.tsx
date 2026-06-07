import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Header } from '../components/layout/Header';
import { ArrowLeft, Mail, ShieldCheck, Sparkles } from 'lucide-react';

const dotGridStyle: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

export const LoginPage: React.FC = () => {
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState('');

  const { requestMagicLink } = useAuth();
  const { t } = useLanguage();

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
          <p className='text-sm text-gray-400 text-center'>{t('auth.magicLink.description')}</p>

          <div className='w-full max-w-md mt-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl'>
            <div className='flex items-center gap-2 mb-4'>
              <Mail className='w-4 h-4 text-emax-400' />
              <h3 className='text-sm font-semibold text-gray-300'>{t('auth.magicLink.title')}</h3>
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
                  <div className='p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl'>
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

            <div className='mt-6 rounded-2xl border border-emax-300/15 bg-emax-400/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'>
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
