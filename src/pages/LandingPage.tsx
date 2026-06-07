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
        {/* Glass UI Hero Section */}
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.28),_transparent_34%),linear-gradient(135deg,#0a0a0a_0%,#171717_45%,#450a0a_100%)]">
          <div className="absolute inset-0 pointer-events-none" style={dotGridStyle} />
          <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-emax-500/25 blur-[110px] pointer-events-none" />
          <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-amber-400/10 blur-[120px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 sm:pt-32 sm:pb-36 lg:pt-36 lg:pb-44">
            <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-12 lg:gap-16 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 shadow-lg shadow-black/20 backdrop-blur-xl mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emax-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emax-400" />
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-emax-100 tracking-wide">
                    {t('landing.badge.networks')}
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-tight">
                  {t('landing.title.main')}
                  <br />
                  <span className="bg-gradient-to-r from-white via-emax-100 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(248,113,113,0.32)]">
                    {t('landing.title.sub')}
                  </span>
                </h1>

                <p className="mt-6 text-base sm:text-lg text-gray-200/85 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  {t('landing.subtitle')}
                </p>

                {!isAuthenticated && (
                  <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link
                      to="/signup"
                      className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-gray-950 hover:bg-emax-50 text-base font-bold rounded-2xl shadow-2xl shadow-emax-950/30 transition-all duration-200"
                    >
                      {t('landing.getStarted')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-7 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white text-base font-semibold rounded-2xl backdrop-blur-xl shadow-lg shadow-black/20 transition-all duration-200"
                    >
                      {t('nav.login')}
                    </Link>
                  </div>
                )}
              </div>

              <div className="relative" aria-label="Smart Quote glass dashboard preview">
                <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-white/20 via-emax-400/10 to-amber-300/10 blur-2xl" />
                <div className="relative rounded-[2rem] border border-white/18 bg-white/[0.09] p-5 sm:p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl">
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emax-100">Live quote desk</p>
                      <p className="mt-1 text-lg font-bold text-white">E-MAX Worldwide Express</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                      Secure
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                      { label: t('landing.stat.carriers'), value: '5', icon: Truck },
                      { label: t('landing.stat.countries'), value: '190+', icon: Globe },
                      { label: t('landing.stat.calculation'), value: '1s', icon: Zap },
                      { label: t('landing.stat.available'), value: '24/7', icon: ShieldCheck },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/12 bg-white/[0.08] p-4 backdrop-blur-xl">
                        <item.icon className="mb-3 h-5 w-5 text-emax-200" />
                        <p className="text-2xl font-extrabold text-white">{item.value}</p>
                        <p className="mt-1 text-xs text-gray-300">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/12 bg-gray-950/35 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">SEL → LAX · Express</span>
                      <span className="font-semibold text-emerald-200">Optimized</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-emax-400 to-amber-300" />
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                      <span className="text-xs text-gray-300">Estimated margin visibility</span>
                      <span className="text-sm font-bold text-white">Admin-ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-100 dark:bg-gray-900 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '5', label: t('landing.stat.carriers'), icon: Truck },
                { value: '190+', label: t('landing.stat.countries'), icon: Globe },
                { value: '1s', label: t('landing.stat.calculation'), icon: Zap },
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
