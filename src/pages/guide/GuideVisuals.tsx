import React from 'react';
import {
  Package,
  ArrowRight,
  ArrowDown,
  BarChart3,
  Cloud,
  Newspaper,
  DollarSign,
  Calculator,
  Truck,
  FileText,
  Bell,
  Save,
  StickyNote,
  Hash,
  Box,
  Ruler,
  Ship,
} from 'lucide-react';

type Lang = 'en' | 'ko';

interface VisualProps {
  lang: Lang;
}

/* ─── Helper ─── */
const t = (dict: Record<string, string>, lang: Lang) => dict[lang] || dict.en;

/* ═══════════════════════════════════════════
   1. QuoteFlowDiagram
   ═══════════════════════════════════════════ */
export const QuoteFlowDiagram: React.FC<VisualProps> = ({ lang }) => {
  const steps = [
    {
      label: { en: 'Route Setup', ko: '경로 설정', cn: '路线设置', ja: 'ルート設定' },
      icon: <Truck className="w-5 h-5" />,
    },
    {
      label: { en: 'Cargo Input', ko: '화물 입력', cn: '货物输入', ja: '貨物入力' },
      icon: <Package className="w-5 h-5" />,
    },
    {
      label: { en: 'Auto Calculate', ko: '자동 계산', cn: '自动计算', ja: '自動計算' },
      icon: <Calculator className="w-5 h-5" />,
    },
    {
      label: { en: 'View Results', ko: '결과 확인', cn: '查看结果', ja: '結果確認' },
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: { en: 'Save / PDF', ko: '저장 / PDF', cn: '保存 / PDF', ja: '保存 / PDF' },
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  return (
    <div className="py-2">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
              <div className="w-12 h-12 rounded-xl bg-emax-50 dark:bg-emax-900/30 border border-emax-200 dark:border-emax-700 flex items-center justify-center text-emax-600 dark:text-emax-400">
                {step.icon}
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                {t(step.label, lang)}
              </span>
            </div>
            {i < steps.length - 1 && (
              <>
                <ArrowRight className="hidden sm:block w-5 h-5 text-emax-300 dark:text-emax-600 mx-1 flex-shrink-0" />
                <ArrowDown className="sm:hidden w-5 h-5 text-emax-300 dark:text-emax-600 my-0.5 flex-shrink-0" />
              </>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   2. DashboardLayoutDiagram
   ═══════════════════════════════════════════ */
export const DashboardLayoutDiagram: React.FC<VisualProps> = ({ lang }) => {
  const labels = {
    recentQuotes: { en: 'Recent Quotes', ko: '최근 견적', cn: '最近报价', ja: '最近の見積' },
    weather: { en: 'Weather', ko: '날씨', cn: '天气', ja: '天気' },
    news: { en: 'News', ko: '뉴스', cn: '新闻', ja: 'ニュース' },
    exchange: { en: 'Exchange Rates', ko: '환율', cn: '汇率', ja: '為替レート' },
    calculator: { en: 'Currency Calc', ko: '환율 계산기', cn: '汇率计算器', ja: '通貨計算機' },
    mainArea: { en: 'Main Area (2/3)', ko: '메인 영역 (2/3)', cn: '主区域 (2/3)', ja: 'メインエリア (2/3)' },
    sidebar: { en: 'Sidebar (1/3)', ko: '사이드바 (1/3)', cn: '侧栏 (1/3)', ja: 'サイドバー (1/3)' },
  };

  return (
    <div className="py-2">
      {/* Column labels */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="col-span-2 text-center">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {t(labels.mainArea, lang)}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {t(labels.sidebar, lang)}
          </span>
        </div>
      </div>

      {/* Layout grid */}
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {/* Left column */}
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emax-50 dark:bg-emax-900/30 border border-emax-200 dark:border-emax-700">
            <BarChart3 className="w-3.5 h-3.5 text-emax-500 dark:text-emax-400" />
            <span className="text-xs font-medium text-emax-700 dark:text-emax-300">
              {t(labels.recentQuotes, lang)}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
            <Cloud className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
              {t(labels.weather, lang)}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <Newspaper className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
              {t(labels.news, lang)}
            </span>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              {t(labels.exchange, lang)}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Calculator className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {t(labels.calculator, lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   3. CarrierComparisonVisual
   ═══════════════════════════════════════════ */
export const CarrierComparisonVisual: React.FC<VisualProps> = ({ lang }) => {
  const labels = {
    zones: { en: 'Zones', ko: '존', cn: '区域', ja: 'ゾーン' },
    type: { en: 'Type', ko: '유형', cn: '类型', ja: '種類' },
    tier: { en: 'Tier', ko: '등급', cn: '等级', ja: '等級' },
    global: { en: 'Global', ko: '글로벌', cn: '全球', ja: 'グローバル' },
    express: { en: 'Express', ko: '특송', cn: '快递', ja: 'エクスプレス' },
    perCountry: { en: 'Per-country', ko: '국가별', cn: '按国家', ja: '国別' },
    cnVnOnly: { en: 'CN/VN only', ko: 'CN/VN 전용', cn: '仅限CN/VN', ja: 'CN/VNのみ' },
    standard: { en: 'Standard', ko: '표준', cn: '标准', ja: '標準' },
    premium: { en: 'Premium', ko: '프리미엄', cn: '高级', ja: 'プレミアム' },
    economy: { en: 'Economy', ko: '이코노미', cn: '经济', ja: 'エコノミー' },
  };

  const carriers = [
    {
      name: 'UPS',
      zones: 'Z1–Z10',
      type: labels.global,
      tier: labels.standard,
      accent: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300',
      badge: 'bg-amber-600 dark:bg-amber-500',
    },
    {
      name: 'DHL',
      zones: 'Z1–Z8',
      type: labels.express,
      tier: labels.premium,
      accent: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300',
      badge: 'bg-yellow-600 dark:bg-yellow-500',
    },
  ];

  return (
    <div className="py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {carriers.map((carrier) => (
          <div
            key={carrier.name}
            className={`rounded-xl border p-4 ${carrier.accent}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${carrier.badge}`} />
              <span className="text-sm font-bold">{carrier.name}</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="opacity-70">{t(labels.zones, lang)}</span>
                <span className="font-medium">
                  {typeof carrier.zones === 'string' ? carrier.zones : t(carrier.zones, lang)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">{t(labels.type, lang)}</span>
                <span className="font-medium">{t(carrier.type, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">{t(labels.tier, lang)}</span>
                <span className="font-medium">{t(carrier.tier, lang)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   4. MarginPriorityDiagram
   ═══════════════════════════════════════════ */
export const MarginPriorityDiagram: React.FC<VisualProps> = ({ lang }) => {
  const levels = [
    {
      code: 'P100',
      label: { en: 'Per-user flat', ko: '사용자별 고정', cn: '用户固定', ja: 'ユーザー固定' },
      color: 'bg-red-500 dark:bg-red-600',
      textColor: 'text-white',
      width: 'w-[45%]',
    },
    {
      code: 'P90',
      label: { en: 'Per-user weight', ko: '사용자별 중량', cn: '用户重量', ja: 'ユーザー重量' },
      color: 'bg-orange-400 dark:bg-orange-500',
      textColor: 'text-white',
      width: 'w-[60%]',
    },
    {
      code: 'P50',
      label: { en: 'Nationality', ko: '국적별', cn: '国籍', ja: '国籍別' },
      color: 'bg-amber-300 dark:bg-amber-500',
      textColor: 'text-amber-900 dark:text-white',
      width: 'w-[75%]',
    },
    {
      code: 'P0',
      label: { en: 'Default', ko: '기본값', cn: '默认', ja: 'デフォルト' },
      color: 'bg-gray-300 dark:bg-gray-600',
      textColor: 'text-gray-700 dark:text-gray-200',
      width: 'w-full',
    },
  ];

  const priorityLabel = { en: 'Priority', ko: '우선순위', cn: '优先级', ja: '優先順位' };
  const highLabel = { en: 'High', ko: '높음', cn: '高', ja: '高' };
  const lowLabel = { en: 'Low', ko: '낮음', cn: '低', ja: '低' };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">
          {t(highLabel, lang)} {t(priorityLabel, lang)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {t(lowLabel, lang)} {t(priorityLabel, lang)}
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        {levels.map((level) => (
          <div key={level.code} className={`${level.width} flex justify-center`}>
            <div
              className={`w-full rounded-lg px-4 py-2.5 ${level.color} ${level.textColor} flex items-center justify-between`}
            >
              <span className="text-xs font-bold">{level.code}</span>
              <span className="text-xs font-medium">{t(level.label, lang)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   5. VolWeightFormula
   ═══════════════════════════════════════════ */
export const VolWeightFormula: React.FC<VisualProps> = ({ lang }) => {
  const volWeightLabel = {
    en: 'Volumetric Weight',
    ko: '부피중량',
    cn: '体积重量',
    ja: '容積重量',
  };

  return (
    <div className="py-2">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* Package icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emax-50 dark:bg-emax-900/30 border border-emax-200 dark:border-emax-700">
          <Box className="w-7 h-7 text-emax-500 dark:text-emax-400" />
        </div>

        {/* Formula */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {/* L */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">L</span>
            </div>
            <Ruler className="w-3 h-3 text-gray-400 mt-0.5" />
          </div>
          <span className="text-lg font-bold text-gray-400 dark:text-gray-500">&times;</span>
          {/* W */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 flex items-center justify-center">
              <span className="text-sm font-bold text-green-700 dark:text-green-300">W</span>
            </div>
            <Ruler className="w-3 h-3 text-gray-400 mt-0.5" />
          </div>
          <span className="text-lg font-bold text-gray-400 dark:text-gray-500">&times;</span>
          {/* H */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 flex items-center justify-center">
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">H</span>
            </div>
            <Ruler className="w-3 h-3 text-gray-400 mt-0.5" />
          </div>
          <span className="text-lg font-bold text-gray-400 dark:text-gray-500">&divide;</span>
          {/* Divisor */}
          <div className="w-14 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">5000</span>
          </div>
          <span className="text-lg font-bold text-gray-400 dark:text-gray-500">=</span>
          {/* Result */}
          <div className="px-3 h-10 rounded-lg bg-emax-100 dark:bg-emax-900/30 border border-emax-300 dark:border-emax-700 flex items-center justify-center">
            <span className="text-xs font-bold text-emax-700 dark:text-emax-300">
              {t(volWeightLabel, lang)}
            </span>
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-2">
        UPS & DHL: &divide; 5000
      </p>
    </div>
  );
};

/* ═══════════════════════════════════════════
   6. IncotermsVisual
   ═══════════════════════════════════════════ */
export const IncotermsVisual: React.FC<VisualProps> = ({ lang }) => {
  const sellerLabel = { en: 'Seller', ko: '매도인', cn: '卖方', ja: '売主' };
  const buyerLabel = { en: 'Buyer', ko: '매수인', cn: '买方', ja: '買主' };

  const terms = [
    { code: 'EXW', sellerPct: 10 },
    { code: 'FCA', sellerPct: 25 },
    { code: 'FOB', sellerPct: 35 },
    { code: 'CFR', sellerPct: 55 },
    { code: 'CIF', sellerPct: 65 },
    { code: 'DAP', sellerPct: 85 },
    { code: 'DDP', sellerPct: 100 },
  ];

  return (
    <div className="py-2">
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emax-500 dark:bg-emax-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t(sellerLabel, lang)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-300 dark:bg-gray-600" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t(buyerLabel, lang)}
          </span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-1.5">
        {terms.map((term) => (
          <div key={term.code} className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 w-8 text-right">
              {term.code}
            </span>
            <div className="flex-1 flex h-5 rounded-md overflow-hidden">
              <div
                className="bg-emax-500 dark:bg-emax-400 transition-all"
                style={{ width: `${term.sellerPct}%` }}
              />
              <div
                className="bg-gray-200 dark:bg-gray-700 transition-all"
                style={{ width: `${100 - term.sellerPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Arrow labels */}
      <div className="flex justify-between mt-2 px-10">
        <span className="text-[10px] text-emax-500 dark:text-emax-400 font-semibold">
          {t(sellerLabel, lang)} &larr;
        </span>
        <Ship className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
          &rarr; {t(buyerLabel, lang)}
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   7. QuoteSaveFlowDiagram
   ═══════════════════════════════════════════ */
export const QuoteSaveFlowDiagram: React.FC<VisualProps> = ({ lang }) => {
  const steps = [
    {
      label: { en: 'Save Quote', ko: '견적 저장', cn: '保存报价', ja: '見積保存' },
      icon: <Save className="w-5 h-5" />,
    },
    {
      label: { en: 'Add Notes', ko: '메모 추가', cn: '添加备注', ja: 'メモ追加' },
      icon: <StickyNote className="w-5 h-5" />,
    },
    {
      label: { en: 'SQ-YYYY-NNNN', ko: 'SQ-YYYY-NNNN', cn: 'SQ-YYYY-NNNN', ja: 'SQ-YYYY-NNNN' },
      icon: <Hash className="w-5 h-5" />,
    },
    {
      label: { en: 'Slack Alert', ko: 'Slack 알림', cn: 'Slack 通知', ja: 'Slack通知' },
      icon: <Bell className="w-5 h-5" />,
      note: { en: 'Member only', ko: 'Member 전용', cn: '仅限Member', ja: 'Memberのみ' },
    },
  ];

  return (
    <div className="py-2">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
              <div className="w-12 h-12 rounded-xl bg-emax-50 dark:bg-emax-900/30 border border-emax-200 dark:border-emax-700 flex items-center justify-center text-emax-600 dark:text-emax-400">
                {step.icon}
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                {t(step.label, lang)}
              </span>
              {step.note && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                  ({t(step.note, lang)})
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <>
                <ArrowRight className="hidden sm:block w-5 h-5 text-emax-300 dark:text-emax-600 mx-1 flex-shrink-0" />
                <ArrowDown className="sm:hidden w-5 h-5 text-emax-300 dark:text-emax-600 my-0.5 flex-shrink-0" />
              </>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
