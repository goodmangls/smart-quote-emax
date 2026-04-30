import React, { useState, useMemo, lazy, Suspense } from 'react';
import { QuoteInput, QuoteResult, QuoteDetail, Incoterm, PackingType } from '../types';
import { calculateQuote } from '@/features/quote/services/calculationService';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AppView } from '@/components/layout/NavigationTabs';
import { InputSection } from '@/features/quote/components/InputSection';
import { ResultSection } from '@/features/quote/components/ResultSection';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_EXCHANGE_RATE, DEFAULT_FSC_PERCENT, DEFAULT_FSC_PERCENT_DHL, DEFAULT_FSC_PERCENT_FEDEX, DEFAULT_FSC_PERCENT_OCS } from '@/config/rates';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useResolvedDiscount } from '@/features/dashboard/hooks/useResolvedDiscount';
import { CalculatorActionBar } from './components/CalculatorActionBar';
import { Footer } from '@/components/layout/Footer';
import { MobileStickyBottomBar } from './components/MobileStickyBottomBar';

const AdminWidgets = lazy(() => import('./components/AdminWidgets').then(m => ({ default: m.AdminWidgets })));
const QuoteHistoryPage = lazy(() => import('@/features/history/components/QuoteHistoryPage').then(m => ({ default: m.QuoteHistoryPage })));

const INITIAL_INPUT: QuoteInput = {
  originCountry: 'KR',
  destinationCountry: 'US',
  destinationZip: '',
  shippingMode: 'Door-to-Door',
  incoterm: Incoterm.DAP,
  packingType: PackingType.NONE,
  items: [
    { id: '1', width: 10, length: 10, height: 10, weight: 1, quantity: 1 }
  ],
  discountPercent: 0,
  dutyTaxEstimate: 0,
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  fscPercent: DEFAULT_FSC_PERCENT,
  overseasCarrier: 'UPS',
  manualPackingCost: undefined
};

const QuoteCalculator: React.FC<{ isPublic?: boolean }> = ({ isPublic = false }) => {
  const [currentView, setCurrentView] = useState<AppView>('calculator');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const { isDarkMode, toggleDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canSaveAndViewHistory = !!user && user.role !== 'member';
  const hideMargin = isPublic || user?.role === 'member';
  const showUSD = false; // KRW 기본, 내부 사용자 전용
  const isKorean = user?.nationality === 'KR';

  const [input, setInput] = useState<QuoteInput>(INITIAL_INPUT);
  const [lastFscCarrier, setLastFscCarrier] = useState<string | null>(null);

  React.useEffect(() => {
    const carrier = input.overseasCarrier || 'UPS';
    if (lastFscCarrier !== carrier) {
      let carrierDefault = DEFAULT_FSC_PERCENT;
      if (carrier === 'DHL') carrierDefault = DEFAULT_FSC_PERCENT_DHL;
      else if (carrier === 'FEDEX') carrierDefault = DEFAULT_FSC_PERCENT_FEDEX;
      else if (carrier === 'OCS') carrierDefault = DEFAULT_FSC_PERCENT_OCS;
      else if (carrier === 'EMAX') carrierDefault = 0;
      
      setInput(prev => ({ ...prev, fscPercent: carrierDefault }));
      setLastFscCarrier(carrier);
    }
  }, [input.overseasCarrier, lastFscCarrier]);

  const result = useMemo<QuoteResult | null>(() => {
    try {
      return calculateQuote(input);
    } catch {
      return null;
    }
  }, [input]);

  // Auto-select lowest-cost carrier when destination changes
  const hasManuallySelectedCarrier = React.useRef(false);
  const lastAutoSelectCountry = React.useRef<string>('');

  React.useEffect(() => {
    if (hasManuallySelectedCarrier.current) return;
    if (!result) return;
    if (lastAutoSelectCountry.current === input.destinationCountry) return;
    lastAutoSelectCountry.current = input.destinationCountry;

    try {
      const altCarrier = input.overseasCarrier === 'DHL' ? 'UPS' : 'DHL';
      const altFsc = altCarrier === 'DHL' ? DEFAULT_FSC_PERCENT_DHL : DEFAULT_FSC_PERCENT;
      const altResult = calculateQuote({ ...input, overseasCarrier: altCarrier, fscPercent: altFsc });

      if (altResult.totalQuoteAmount < result.totalQuoteAmount) {
        setInput(prev => ({ ...prev, overseasCarrier: altCarrier, fscPercent: altFsc }));
        setLastFscCarrier(altCarrier);
      }
    } catch { /* keep current carrier */ }
  }, [input.destinationCountry, result, input.overseasCarrier, input]);

  const hasManuallyChangedDiscount = React.useRef(false);
  const discountResolutionTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const { data: resolvedDiscount } = useResolvedDiscount(
    user?.email, user?.nationality, result?.billableWeight
  );

  React.useEffect(() => {
    if (!result || hasManuallyChangedDiscount.current) return;

    if (discountResolutionTimeout.current) clearTimeout(discountResolutionTimeout.current);

    discountResolutionTimeout.current = setTimeout(() => {
      let defaultDiscount: number;

      if (resolvedDiscount) {
        defaultDiscount = resolvedDiscount.discountPercent;
      } else {
        defaultDiscount = 0; // 정가 기준, 할인 없음
      }

      if (input.discountPercent !== defaultDiscount) {
        setInput(prev => ({ ...prev, discountPercent: defaultDiscount }));
      }
    }, 300);

    return () => {
      if (discountResolutionTimeout.current) clearTimeout(discountResolutionTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally track only billableWeight, not entire result
  }, [result?.billableWeight, resolvedDiscount, user?.nationality, user?.email, isKorean, input.discountPercent]);

  const handleDiscountChange = (newDiscount: number) => {
    hasManuallyChangedDiscount.current = true;
    setInput((prev: QuoteInput) => ({ ...prev, discountPercent: newDiscount }));
  };

  const handleDuplicate = (quote: QuoteDetail) => {
    const duplicatedInput: QuoteInput = {
      originCountry: quote.originCountry || 'KR',
      destinationCountry: quote.destinationCountry,
      destinationZip: quote.destinationZip || '',
      incoterm: (quote.incoterm as Incoterm) || Incoterm.DAP,
      packingType: (quote.packingType as PackingType) || PackingType.NONE,
      items: quote.items.map((item, i) => ({ ...item, id: String(i + 1) })),
      discountPercent: quote.discountPercent,
      dutyTaxEstimate: quote.dutyTaxEstimate,
      exchangeRate: quote.exchangeRate,
      fscPercent: quote.fscPercent,
      overseasCarrier: (quote.overseasCarrier as QuoteInput['overseasCarrier']) || 'UPS',
      shippingMode: 'Door-to-Door',
      manualPackingCost: quote.manualPackingCost ?? undefined,
    };
    setInput(duplicatedInput);
    hasManuallyChangedDiscount.current = true;
    setCurrentView('calculator');
  };

  const handleReset = () => setShowResetConfirm(true);
  const handleDownloadPdf = async () => {
    if (!result) return;
    const { generatePDF } = await import('@/lib/pdfService');
    await generatePDF(input, result, undefined, { isAdmin, isKorean, showUSD });
  };
  const handleQuoteSaved = () => setCurrentView('history');
  const scrollToResults = () => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const layoutProps = {
    isDarkMode,
    setIsDarkMode: (v: boolean) => { if (v !== isDarkMode) toggleDarkMode(); },
    isMobileView,
    setIsMobileView,
    input,
    setInput,
    result,
    onDiscountChange: handleDiscountChange,
    onDownloadPdf: handleDownloadPdf,
    onReset: handleReset,
    scrollToResults,
    hideMargin,
    resolvedDiscount,
    isAdmin,
    isKorean,
    showUSD,
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen font-sans transition-colors duration-200">
      <Header />
      <CalculatorActionBar
        currentView={currentView}
        onViewChange={setCurrentView}
        canSaveAndViewHistory={canSaveAndViewHistory}
        input={input}
        result={result}
        onQuoteSaved={handleQuoteSaved}
        onReset={handleReset}
        isMobileView={isMobileView}
        onToggleMobileView={() => setIsMobileView(!isMobileView)}
      />

      {currentView === 'calculator' ? (
        <>
          {isMobileView ? (
            <MobileLayout 
              {...layoutProps} 
              discountPercent={result?.discountPercent ?? 0}
              onSwitchCarrier={(carrier) => setInput(prev => ({ ...prev, overseasCarrier: carrier }))}
            />
          ) : (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 lg:pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('calc.shipmentConfig')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('calc.shipmentConfigDesc')}</p>
                  </div>
                  <InputSection
                    input={input}
                    onChange={setInput}
                    onDiscountChange={handleDiscountChange}
                    effectiveDiscountPercent={result?.discountPercent}
                    hideMargin={hideMargin}
                    showUSD={showUSD}
                    intlBase={result?.breakdown.intlBase}
                    billableWeight={result?.billableWeight}
                    resolvedDiscount={resolvedDiscount}
                  />
                  {isAdmin && (
                    <Suspense fallback={null}>
                      <AdminWidgets />
                    </Suspense>
                  )}
                </div>
                <div className="lg:col-span-5 lg:sticky top-24" id="result-section">
                  {result && (
                    <ResultSection
                      result={result}
                      input={input}
                      hideMargin={hideMargin}
                      onDiscountChange={handleDiscountChange}
                      onDownloadPdf={handleDownloadPdf}
                      onSwitchCarrier={(carrier) => {
                        hasManuallySelectedCarrier.current = true;
                        setInput(prev => ({ ...prev, overseasCarrier: carrier }));
                      }}
                      discountPercent={input.discountPercent}
                      isKorean={isKorean}
                      showUSD={showUSD}
                    />
                  )}
                </div>
              </div>
            </main>
          )}
          {result && !isMobileView && (
            <MobileStickyBottomBar
              result={result}
              isKorean={isKorean}
              showUSD={showUSD}
              onViewDetails={scrollToResults}
            />
          )}
        </>
      ) : (
        <Suspense fallback={<div className="min-h-screen" />}>
          <QuoteHistoryPage onDuplicate={handleDuplicate} />
        </Suspense>
      )}

      <div className="hidden lg:block">
        <Footer />
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title={t('calc.resetTitle')}
        message={t('calc.resetMessage')}
        confirmLabel={t('calc.resetQuote')}
        variant="warning"
        onConfirm={() => { setShowResetConfirm(false); setInput(INITIAL_INPUT); hasManuallySelectedCarrier.current = false; lastAutoSelectCountry.current = ''; }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

export default QuoteCalculator;
