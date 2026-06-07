import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const MagicLinkVerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { verifyMagicLink } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'error'>(token ? 'verifying' : 'error');
  const [errorMessage, setErrorMessage] = useState(token ? '' : t('auth.magicLink.invalidToken'));
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || !token) return;
    attempted.current = true;
    window.history.replaceState({}, document.title, '/auth/verify');

    verifyMagicLink(token).then((result) => {
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setErrorMessage(result.error ?? t('auth.magicLink.invalidToken'));
        setStatus('error');
      }
    });
  }, [token, verifyMagicLink, navigate, t]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-950'>
      <div className='text-center'>
        {status === 'verifying' ? (
          <>
            <div className='w-8 h-8 border-2 border-gray-600 border-t-emax-500 rounded-full animate-spin mx-auto mb-4' />
            <p className='text-gray-300 text-sm'>{t('auth.magicLink.verifying')}</p>
          </>
        ) : (
          <>
            <p className='text-red-400 text-sm mb-4'>{errorMessage}</p>
            <Link to='/login' className='text-emax-400 hover:underline text-sm'>
              {t('auth.magicLink.backToLogin')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default MagicLinkVerifyPage;
