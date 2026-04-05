import React, { useState } from 'react';
import * as Sentry from '@sentry/browser';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Header } from '../components/layout/Header';
import { ShieldCheck, ArrowLeft, HelpCircle } from 'lucide-react';
import type { FreightNetwork } from '../contexts/AuthContext';
import { NATIONALITY_OPTIONS } from '../config/options';

const dotGridStyle: React.CSSProperties = {
  backgroundImage:
    'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

export const SignUpPage: React.FC = () => {
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [networks, setNetworks] = useState<FreightNetwork[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleNetwork = (network: FreightNetwork) => {
    setNetworks(prev =>
      prev.includes(network) ? prev.filter(n => n !== network) : [...prev, network]
    );
  };

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

    if (email.trim() && password.trim() && name.trim()) {
      setIsLoading(true);
      try {
        const result = await signup(email.trim(), password.trim(), company.trim(), name.trim(), nationality.trim(), networks);
        if (result.success) {
           navigate('/admin', { replace: true });
        } else {
          setError(result.error || t('auth.emailExists'));
        }
      } catch (e) {
        Sentry.captureException(e);
        setError(t('auth.emailExists'));
      } finally {
        setIsLoading(false);
      }
    } else {
      setError(t('auth.fillAll'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black">
        <div className="absolute inset-0 pointer-events-none" style={dotGridStyle} />
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full bg-emax-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[300px] h-[300px] rounded-full bg-emax-500/15 blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center py-16 sm:py-24 px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.backHome')}
          </Link>

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-2">
            {t('auth.signupTitle')}
          </h2>
          <p className="text-sm text-gray-400 text-center">
            {t('auth.systemName')}
          </p>

          <div className="w-full max-w-md mt-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('auth.company')}
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors"
                  placeholder={t('auth.optional')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                    {t('auth.name')}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-300 mb-1.5">
                    {t('auth.nationality')}
                  </label>
                  <select
                    id="nationality"
                    name="nationality"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '2.5rem' }}
                  >
                    <option value="" className="bg-gray-800 text-white">{`🌍 ${t('auth.optional')}`}</option>
                    {NATIONALITY_OPTIONS.map((country, idx) => (
                      <React.Fragment key={country.code}>
                        {idx === 7 && <option disabled className="bg-gray-800 text-gray-500">{'─'.repeat(20)}</option>}
                        <option value={country.code} className="bg-gray-800 text-white">{country.name}</option>
                      </React.Fragment>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2.5">
                  {t('auth.networks')}
                </label>
                <div className="flex flex-wrap gap-3">
                  {(['WCA', 'MPL', 'EAN'] as FreightNetwork[]).map((net) => (
                    <label
                      key={net}
                      className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 text-sm font-medium ${
                        networks.includes(net)
                          ? 'bg-emax-600/20 border-emax-500/50 text-emax-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={networks.includes(net)}
                        onChange={() => toggleNetwork(net)}
                        className="sr-only"
                      />
                      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        networks.includes(net)
                          ? 'bg-emax-500 border-emax-500'
                          : 'border-gray-500'
                      }`}>
                        {networks.includes(net) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {net}
                      <HelpCircle className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-xs text-gray-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 shadow-xl">
                        {t(`auth.networkDesc.${net}`)}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {t('auth.networksHint')}
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emax-500/50 focus:border-emax-500/50 text-sm transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emax-600 hover:bg-emax-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emax-600/25 hover:shadow-emax-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : t('auth.signup')}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <p className="text-sm text-gray-400">
                {t('auth.haveAccount')}{' '}
                <Link to="/login" className="font-semibold text-emax-400 hover:text-emax-300 transition-colors">
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
