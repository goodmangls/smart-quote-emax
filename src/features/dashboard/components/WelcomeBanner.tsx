import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const bannerGridStyle: React.CSSProperties = {
  backgroundImage:
    'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

export const WelcomeBanner: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-jways-950 to-gray-900 dark:from-gray-950 dark:via-jways-950 dark:to-gray-950 rounded-2xl p-6 sm:p-8 text-white">
      <div className="absolute inset-0 pointer-events-none" style={bannerGridStyle} />
      <div className="absolute -top-20 -right-20 w-[200px] h-[200px] rounded-full bg-jways-600/20 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-[150px] h-[150px] rounded-full bg-jways-500/15 blur-[60px] pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold">
            {t('dashboard.welcome')}, {user?.name || user?.email?.split('@')[0] || 'Guest'}{t('dashboard.honorific')}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {user?.email}
          </p>
        </div>
        <button
          onClick={() => navigate('/quote')}
          className="group inline-flex items-center gap-2 bg-jways-600 hover:bg-jways-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-jways-600/25 hover:shadow-jways-500/30 transition-all active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          {t('dashboard.newQuote')}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
