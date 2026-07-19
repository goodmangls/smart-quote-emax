import React, { useState } from 'react';
import * as Sentry from '@sentry/browser';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Header } from '../components/layout/Header';

const dotGridStyle: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

export const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('settings.password.tooShort') || 'Password must be at least 6 characters.');
      return;
    }

    if (email.trim() && password.trim() && name.trim()) {
      setIsLoading(true);
      try {
        const result = await signup(email.trim(), password.trim(), undefined, name.trim());
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.error || t('auth.emailExists'));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        Sentry.captureException(err);
        setError(message || t('auth.emailExists'));
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
        <div className='absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full bg-emax-600/20 blur-[120px] pointer-events-none' />
        <div className='absolute -bottom-40 -right-40 w-[300px] h-[300px] rounded-full bg-emax-500/15 blur-[100px] pointer-events-none' />

        <div className='relative flex flex-col items-center justify-center py-16 sm:py-24 px-4'>
          <Link
            to='/'
            className='inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            {t('auth.backHome')}
          </Link>

          <div className='w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6'>
            <ShieldCheck className='w-7 h-7 text-emerald-400' />
          </div>

          <h2 className='text-2xl sm:text-3xl font-extrabold text-white text-center mb-2'>
            {t('auth.signupTitle')}
          </h2>
          <p className='text-sm text-gray-400 text-center'>{t('auth.systemName')}</p>

          <div className='w-full max-w-md mt-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl'>
            <form className='space-y-5' onSubmit={handleSubmit}>
              {error && (
                <div className='p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl'>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor='name' className='block text-sm font-medium text-gray-300 mb-1.5'>
                  {t('auth.name')}
                </label>
                <input
                  id='name'
                  name='name'
                  type='text'
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors'
                />
              </div>

              <div>
                <label htmlFor='email' className='block text-sm font-medium text-gray-300 mb-1.5'>
                  {t('auth.email')}
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors'
                />
              </div>

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-gray-300 mb-1.5'
                >
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors'
                />
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full py-3 px-4 bg-emax-600 hover:bg-emax-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emax-600/25 hover:shadow-emax-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? '...' : t('auth.signup')}
              </button>
            </form>

            <div className='mt-6 pt-5 border-t border-white/10 text-center'>
              <p className='text-sm text-gray-400'>
                {t('auth.haveAccount')}{' '}
                <Link
                  to='/login'
                  className='font-semibold text-emax-400 hover:text-emax-300 transition-colors'
                >
                  {t('nav.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
