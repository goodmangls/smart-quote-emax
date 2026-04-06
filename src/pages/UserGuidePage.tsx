import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  BookOpen,
  Rocket,
  Calculator,
  Shield,
  Users,
  ClipboardList,
  ChevronRight,
  Menu,
  X,
  Info,
  Lightbulb,
} from 'lucide-react';
import { guideTranslations, type GuideSection } from './guide/guideTranslations';

const MEMBER_SECTION_KEYS = [
  'setup',
  'calculator',
] as const;

const ADMIN_SECTION_KEYS = [
  'systemSettings',
  'userOperations',
  'auditLog',
] as const;

type SectionKey = (typeof MEMBER_SECTION_KEYS)[number] | (typeof ADMIN_SECTION_KEYS)[number];

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  setup: <Rocket className="w-5 h-5" />,
  calculator: <Calculator className="w-5 h-5" />,
  systemSettings: <Shield className="w-5 h-5" />,
  userOperations: <Users className="w-5 h-5" />,
  auditLog: <ClipboardList className="w-5 h-5" />,
};

const UserGuidePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('setup');
  const [isTocOpen, setIsTocOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const guide = guideTranslations[language] || guideTranslations.en;

  const visibleSectionKeys = useMemo(() => {
    const keys: SectionKey[] = [...MEMBER_SECTION_KEYS];
    if (isAdmin) {
      keys.push(...ADMIN_SECTION_KEYS);
    }
    return keys;
  }, [isAdmin]);

  const scrollToSection = (key: string) => {
    setActiveSection(key);
    setIsTocOpen(false);
    const el = document.getElementById(`guide-section-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderTipBox = (text: string) => (
    <div className="flex items-start gap-3 bg-emax-50 dark:bg-emax-900/20 border border-emax-200 dark:border-emax-800 rounded-lg p-4 my-4">
      <Lightbulb className="w-5 h-5 text-emax-500 dark:text-emax-400 flex-shrink-0 mt-0.5" />
      <div>
        <span className="text-xs font-bold text-emax-600 dark:text-emax-400 uppercase tracking-wider">
          {guide.tipLabel}
        </span>
        <p className="text-sm text-emax-800 dark:text-emax-200 mt-1">{text}</p>
      </div>
    </div>
  );

  const renderNoteBox = (text: string) => (
    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 my-4">
      <Info className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          {guide.noteLabel}
        </span>
        <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">{text}</p>
      </div>
    </div>
  );

  const renderSection = (key: SectionKey, section: GuideSection, index: number) => {
    const isAdminSection = (ADMIN_SECTION_KEYS as readonly string[]).includes(key);

    return (
      <div
        key={key}
        id={`guide-section-${key}`}
        className="scroll-mt-20"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-200">
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emax-100 dark:bg-emax-900/30 text-emax-600 dark:text-emax-400">
                {SECTION_ICONS[key]}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              {isAdminSection && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                  {guide.adminBadge}
                </span>
              )}
            </div>
          </div>

          {/* Section Items */}
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {section.items
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item, itemIndex) => (
              <div key={itemIndex} className="px-6 py-5">
                <div className="flex items-start gap-3">
                   <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-emax-500" />
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-3">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips for Core Sections */}
          {key === 'setup' && (
            <div className="px-6 pb-5">
              {renderTipBox(
                language === 'ko'
                  ? '모든 설정은 기기 간 실시간으로 동기화됩니다.'
                  : 'All your preferences are synchronized across devices in real-time.'
              )}
            </div>
          )}
          {key === 'calculator' && (
            <div className="px-6 pb-5">
              {renderNoteBox(
                language === 'ko'
                  ? '부피중량 계산 시 5000 계수가 자동으로 적용됩니다.'
                  : 'A factor of 5000 is automatically applied for volumetric weight calculation.'
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-3 mb-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <BookOpen className="w-6 h-6 text-emax-600 dark:text-emax-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {guide.pageTitle}
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 ml-1">
             {t('nav.smartQuote')} 플랫폼 사용에 도움이 되는 정보를 확인하세요.
          </p>
        </div>

        {/* Mobile TOC Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {guide.tocTitle}
            </span>
            {isTocOpen ? (
              <X className="w-4 h-4 text-gray-500" />
            ) : (
              <Menu className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {isTocOpen && (
            <div className="mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <nav className="py-2">
                {visibleSectionKeys.map((key, index) => {
                  const section = guide.sections[key as keyof typeof guide.sections];
                  const isAdminSection = (ADMIN_SECTION_KEYS as readonly string[]).includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => scrollToSection(key)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        activeSection === key
                          ? 'bg-emax-50 dark:bg-emax-900/20 text-emax-600 dark:text-emax-400 font-semibold'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 truncate">{section.title}</span>
                      {isAdminSection && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                           A
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Desktop Layout: Sidebar + Content */}
        <div className="flex gap-8">
          {/* Desktop Sidebar TOC */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <nav className="py-2">
                  {visibleSectionKeys.map((key, index) => {
                    const section = guide.sections[key as keyof typeof guide.sections];
                    const isAdminSection = (ADMIN_SECTION_KEYS as readonly string[]).includes(key);

                    return (
                      <button
                        key={key}
                        onClick={() => scrollToSection(key)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-[13px] transition-all group ${
                          activeSection === key
                            ? 'bg-emax-50 dark:bg-emax-900/20 text-emax-600 dark:text-emax-400 font-semibold border-l-2 border-emax-500'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-2 border-transparent'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 w-4">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="flex-1 truncate">{section.title}</span>
                        {isAdminSection && (
                           <Shield className="w-3 h-3 text-red-500 opacity-60" />
                        )}
                        <ChevronRight
                          className={`w-3 h-3 flex-shrink-0 transition-opacity ${
                            activeSection === key ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                          }`}
                        />
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-6">
            {visibleSectionKeys.map((key, index) => {
               const section = guide.sections[key as keyof typeof guide.sections];
               return renderSection(key as SectionKey, section, index);
            })}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserGuidePage;
