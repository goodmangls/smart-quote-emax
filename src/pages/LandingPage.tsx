import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, TrendingUp, ShieldCheck, ArrowRight, Globe, Truck } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const dotGridStyle: React.CSSProperties = {
  backgroundImage:
    'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'E-MAX — 국제특송 스마트 견적 시스템';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black">
          <div className="absolute inset-0 pointer-events-none" style={dotGridStyle} />
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-emax-600/20 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-emax-500/15 blur-[100px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pt-32 sm:pb-40 lg:pt-40 lg:pb-48">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emax-500/10 border border-emax-500/20 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emax-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emax-500" />
                </span>
                <span className="text-xs sm:text-sm font-medium text-emax-300 tracking-wide">
                  {t('landing.badge.networks')}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-tight">
                {t('landing.title.main')}
                <br />
                <span className="bg-gradient-to-r from-emax-400 to-amber-500 bg-clip-text text-transparent">
                  {t('landing.title.sub')}
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                {t('landing.subtitle')}
              </p>

              {!isAuthenticated && (
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/signup"
                    className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emax-600 hover:bg-emax-500 text-white text-base font-semibold rounded-xl shadow-lg shadow-emax-600/25 hover:shadow-emax-500/30 transition-all duration-200"
                  >
                    {t('landing.getStarted')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-200 text-base font-semibold rounded-xl backdrop-blur-sm transition-all duration-200"
                  >
                    {t('nav.login')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-100 dark:bg-gray-900 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '2', label: t('landing.stat.carriers'), icon: Truck },
                { value: '190+', label: t('landing.stat.countries'), icon: Globe },
                { value: '~3s', label: t('landing.stat.calculation'), icon: Zap },
                { value: '24/7', label: t('landing.stat.available'), icon: ShieldCheck },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-8 h-8 text-emax-500 mx-auto mb-3" />
                  <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white block">{stat.value}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-emax-600 dark:text-emax-400 uppercase tracking-widest mb-3">{t('landing.featuresLabel')}</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                {t('landing.featuresTitle')}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  color: 'text-amber-500',
                  bg: 'bg-amber-500/10',
                  title: t('landing.instantQuotes'),
                  desc: t('landing.instantQuotes.desc'),
                },
                {
                  icon: TrendingUp,
                  color: 'text-emax-500',
                  bg: 'bg-emax-500/10',
                  title: t('landing.accurateBreakdown'),
                  desc: t('landing.accurateBreakdown.desc'),
                },
                {
                  icon: ShieldCheck,
                  color: 'text-emerald-500',
                  bg: 'bg-emerald-500/10',
                  title: t('landing.verifiedCarriers'),
                  desc: t('landing.verifiedCarriers.desc'),
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="group bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:border-emax-300 dark:hover:border-emax-700 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feat.bg} mb-6`}>
                    <feat.icon className={`w-6 h-6 ${feat.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
