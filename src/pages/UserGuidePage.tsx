import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  BookOpen,
  Rocket,
  LayoutDashboard,
  Calculator,
  Save,
  FileDown,
  History,
  Settings,
  Shield,
  Percent,
  Fuel,
  AlertTriangle,
  Users,
  UserCog,
  Table2,
  ClipboardList,
  ChevronRight,
  Menu,
  X,
  Info,
  Lightbulb,
} from 'lucide-react';
import { guideTranslations, type GuideSection } from './guide/guideTranslations';
import {
  QuoteFlowDiagram,
  DashboardLayoutDiagram,
  CarrierComparisonVisual,
  MarginPriorityDiagram,
  VolWeightFormula,
  QuoteSaveFlowDiagram,
} from './guide/GuideVisuals';

const MEMBER_SECTION_KEYS = [
  'gettingStarted',
  'dashboard',
  'quoteCalculator',
  'savingQuotes',
  'pdfExport',
  'quoteHistory',
  'accountSettings',
] as const;

const ADMIN_SECTION_KEYS = [
  'adminOverview',
  'marginRules',
  'fscManagement',
  'surchargeManagement',
  'customerManagement',
  'userManagement',
  'rateTableViewer',
  'auditLog',
] as const;

type SectionKey = (typeof MEMBER_SECTION_KEYS)[number] | (typeof ADMIN_SECTION_KEYS)[number];

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  gettingStarted: <Rocket className="w-5 h-5" />,
  dashboard: <LayoutDashboard className="w-5 h-5" />,
  quoteCalculator: <Calculator className="w-5 h-5" />,
  savingQuotes: <Save className="w-5 h-5" />,
  pdfExport: <FileDown className="w-5 h-5" />,
  quoteHistory: <History className="w-5 h-5" />,
  accountSettings: <Settings className="w-5 h-5" />,
  adminOverview: <Shield className="w-5 h-5" />,
  marginRules: <Percent className="w-5 h-5" />,
  fscManagement: <Fuel className="w-5 h-5" />,
  surchargeManagement: <AlertTriangle className="w-5 h-5" />,
  customerManagement: <Users className="w-5 h-5" />,
  userManagement: <UserCog className="w-5 h-5" />,
  rateTableViewer: <Table2 className="w-5 h-5" />,
  auditLog: <ClipboardList className="w-5 h-5" />,
};

const UserGuidePage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('gettingStarted');
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
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5">
                    {itemIndex + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section-specific visual diagrams */}
          {key === 'dashboard' && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/50">
              <DashboardLayoutDiagram lang={language as 'en' | 'ko'} />
            </div>
          )}
          {key === 'quoteCalculator' && (
            <>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/50">
                <QuoteFlowDiagram lang={language as 'en' | 'ko'} />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/50">
                <VolWeightFormula lang={language as 'en' | 'ko'} />
              </div>
            </>
          )}
          {key === 'savingQuotes' && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/50">
              <QuoteSaveFlowDiagram lang={language as 'en' | 'ko'} />
            </div>
          )}
          {key === 'adminOverview' && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/50">
              <CarrierComparisonVisual lang={language as 'en' | 'ko'} />
            </div>
          )}
          {key === 'marginRules' && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/50">
              <MarginPriorityDiagram lang={language as 'en' | 'ko'} />
            </div>
          )}

          {/* Section-specific tips and notes */}
          {key === 'gettingStarted' && (
            <div className="px-6 pb-5">
              {renderTipBox(
                language === 'ko'
                  ? '물류 네트워크(WCA, MPL, EAN, JCtrans) 가입 여부를 선택하면 맞춤형 서비스를 받을 수 있습니다.'
                  : 'Selecting your freight network membership (WCA, MPL, EAN, JCtrans) enables customized services for your organization.'
              )}
            </div>
          )}

          {key === 'quoteCalculator' && (
            <div className="px-6 pb-5">
              {renderNoteBox(
                language === 'ko'
                  ? '부피중량은 L x W x H / 5000으로 자동 계산됩니다. 실중량과 부피중량 중 큰 값이 적용됩니다.'
                  : 'Volumetric weight is auto-calculated as L x W x H / 5000. The greater of actual vs volumetric weight is used.'
              )}
            </div>
          )}

          {key === 'savingQuotes' && (
            <div className="px-6 pb-5">
              {renderTipBox(
                language === 'ko'
                  ? '견적 참조번호(SQ-YYYY-NNNN)를 고객에게 전달하면 추후 조회가 용이합니다.'
                  : 'Share the quote reference number (SQ-YYYY-NNNN) with your customer for easy future lookup.'
              )}
            </div>
          )}

          {key === 'marginRules' && (
            <div className="px-6 pb-5">
              {renderNoteBox(
                language === 'ko'
                  ? 'P100이 최고 우선순위입니다. 특정 사용자에 대한 고정 할인이 필요하면 P100 규칙을 생성하세요.'
                  : 'P100 has the highest priority. Create a P100 rule when you need a fixed discount for a specific user.'
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-7 h-7 text-emax-600 dark:text-emax-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {guide.pageTitle}
            </h1>
            {isAdmin && (
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                {guide.adminBadge}
              </span>
            )}
            {!isAdmin && (
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-emax-100 dark:bg-emax-900/30 text-emax-600 dark:text-emax-400 rounded-full">
                {guide.memberBadge}
              </span>
            )}
          </div>
        </div>

        {/* Mobile TOC Toggle */}
        <div className="lg:hidden mb-4">
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
                  const section = guide.sections[key];
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
                          {guide.adminBadge}
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
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {guide.tocTitle}
                  </h3>
                </div>
                <nav className="py-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
                  {visibleSectionKeys.map((key, index) => {
                    const section = guide.sections[key];
                    const isAdminSection = (ADMIN_SECTION_KEYS as readonly string[]).includes(key);

                    // Insert divider before admin sections
                    const showDivider = key === 'adminOverview';

                    return (
                      <React.Fragment key={key}>
                        {showDivider && (
                          <div className="mx-4 my-2 border-t border-gray-200 dark:border-gray-700" />
                        )}
                        <button
                          onClick={() => scrollToSection(key)}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-left text-[13px] transition-colors group ${
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
                            <span className="px-1 py-0.5 text-[8px] font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded">
                              A
                            </span>
                          )}
                          <ChevronRight
                            className={`w-3 h-3 flex-shrink-0 transition-opacity ${
                              activeSection === key ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                            }`}
                          />
                        </button>
                      </React.Fragment>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-6">
            {visibleSectionKeys.map((key, index) => {
              const section = guide.sections[key];

              // Insert admin divider
              if (key === 'adminOverview') {
                return (
                  <React.Fragment key={key}>
                    <div className="flex items-center gap-4 pt-4">
                      <div className="flex-1 h-px bg-red-200 dark:bg-red-800" />
                      <span className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-full">
                        {guide.adminBadge}
                      </span>
                      <div className="flex-1 h-px bg-red-200 dark:bg-red-800" />
                    </div>
                    {renderSection(key, section, index)}
                  </React.Fragment>
                );
              }

              return renderSection(key, section, index);
            })}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserGuidePage;
