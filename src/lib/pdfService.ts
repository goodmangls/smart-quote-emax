import type { jsPDF } from 'jspdf';
import { QuoteInput, QuoteResult, PackingType } from '@/types';
import { COUNTRY_OPTIONS } from '@/config/options';
import { PDF_LAYOUT } from '@/config/ui-constants';
import { applyPackingDimensions } from './packing-utils';
import { formatNum, formatNumDec } from './format';
import { loadKoreanFont } from './pdfFontLoader';
import EmaxLogo from '@/assets/logo-base64';

// PDF-safe formatters (avoid ₩ and emoji that break in jsPDF)
const pdfFormatKRW = (val: number): string => `KRW ${Math.round(val).toLocaleString('en-US')}`;
const pdfFormatUSD = (val: number): string => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const stripEmoji = (str: string): string => str.replace(/[^\x20-\x7E]/g, '').trim();

/** Helper to access jspdf-autotable's lastAutoTable property (untyped) */
const getLastAutoTableY = (doc: jsPDF): number =>
  (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

const { COLORS, FONTS, MARGIN_X, PAGE_WIDTH } = PDF_LAYOUT;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const nextLine = (y: number, h = PDF_LAYOUT.LINE_HEIGHT): number => y + h;

type CurrencyMode = 'krw' | 'usd' | 'both';

const PACKING_TYPE_LABELS: Record<string, { ko: string; en: string }> = {
  [PackingType.NONE]: { ko: '포장 없음', en: 'No Packing' },
  [PackingType.WOODEN_BOX]: { ko: '목재 박스', en: 'Wooden Box' },
  [PackingType.SKID]: { ko: '스키드', en: 'Skid' },
  [PackingType.VACUUM]: { ko: '진공 포장', en: 'Vacuum' },
};

// ─── Header ──────────────────────────────────────────────

const drawHeader = (doc: jsPDF, yPos: number, referenceNo?: string, validityDate?: string): number => {
  doc.setFont(FONTS.FAMILY, 'normal');

  // Draw Logo
  try {
    doc.addImage(EmaxLogo, 'SVG', MARGIN_X, yPos - 5, 45, 12);
  } catch (err) {
    console.error('Failed to add logo to PDF:', err);
  }

  // Title (right)
  doc.setFontSize(FONTS.SIZE_TITLE);
  doc.setTextColor(...COLORS.PRIMARY);
  doc.text('Quotation', PAGE_WIDTH - MARGIN_X, yPos, { align: 'right' });

  yPos = nextLine(yPos, 16);

  // Separator line
  doc.setDrawColor(...COLORS.PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, yPos, PAGE_WIDTH - MARGIN_X, yPos);
  yPos = nextLine(yPos, 8);

  // Meta row
  doc.setFontSize(FONTS.SIZE_SMALL);
  doc.setTextColor(...COLORS.TEXT_LIGHT);
  doc.text(`Date: ${new Date().toLocaleDateString('ko-KR')}`, MARGIN_X, yPos);
  const ref = referenceNo || 'DRAFT';
  doc.text(`Ref: ${ref}`, PAGE_WIDTH - MARGIN_X, yPos, { align: 'right' });

  if (validityDate) {
    yPos = nextLine(yPos, 5);
    doc.text(`Valid until: ${validityDate}`, MARGIN_X, yPos);
  }

  return nextLine(yPos, 12);
};

// ─── Shipment Details ────────────────────────────────────

const drawShipmentDetails = (doc: jsPDF, input: QuoteInput, yPos: number): number => {
  doc.setFillColor(...COLORS.BG_HEADER);
  doc.roundedRect(MARGIN_X, yPos - 5, CONTENT_WIDTH, 28, 2, 2, 'F');

  doc.setFontSize(FONTS.SIZE_SUBHEADER);
  doc.setFont(FONTS.FAMILY, 'normal');
  doc.setTextColor(...COLORS.PRIMARY);
  doc.text('Shipment Details', MARGIN_X + 5, yPos);
  yPos = nextLine(yPos, 9);

  doc.setFontSize(FONTS.SIZE_NORMAL);
  doc.setTextColor(...COLORS.TEXT);

  const rawCountryLabel = COUNTRY_OPTIONS.find(c => c.code === input.destinationCountry)?.name || input.destinationCountry;
  const countryLabel = stripEmoji(rawCountryLabel);

  doc.text(`Origin: ${input.originCountry}`, MARGIN_X + 5, yPos);
  doc.text(`Destination: ${countryLabel} (${input.destinationZip || '-'})`, 110, yPos);
  yPos = nextLine(yPos);
  const packingLabel = PACKING_TYPE_LABELS[input.packingType] ?? { ko: input.packingType, en: input.packingType };
  doc.text(`Shipping: ${input.shippingMode || 'Door-to-Door'}`, MARGIN_X + 5, yPos);
  doc.text(`Packing: ${packingLabel.en}`, 110, yPos);

  return nextLine(yPos, 15);
};

// ─── Cargo Manifest Table ────────────────────────────────

const drawCargoTable = async (doc: jsPDF, items: QuoteInput['items'], result: QuoteResult, yPos: number, packingType: PackingType = PackingType.NONE, volumetricDivisor: number = 5000): Promise<number> => {
  const autoTable = (await import('jspdf-autotable')).default;

  doc.setFont(FONTS.FAMILY, 'normal');
  doc.setFontSize(FONTS.SIZE_SUBHEADER);
  doc.setTextColor(...COLORS.PRIMARY);
  doc.text('Cargo Manifest', MARGIN_X, yPos);
  yPos = nextLine(yPos, 4);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Dimensions L×W×H (cm)', 'Weight (kg)', 'Qty', 'Vol. Weight (kg)']],
    body: items.map((item, i) => {
      const packed = applyPackingDimensions(item.length, item.width, item.height, item.weight, packingType);
      const volWeight = (packed.l * packed.w * packed.h) / volumetricDivisor * item.quantity;
      return [
        i + 1,
        `${item.length} × ${item.width} × ${item.height}`,
        formatNum(item.weight),
        item.quantity,
        formatNumDec(volWeight),
      ];
    }),
    foot: [[
      { content: '', colSpan: 2 },
      `Actual: ${formatNum(result.totalActualWeight)} kg`,
      '',
      `Billable: ${formatNum(result.billableWeight)} kg`,
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.PRIMARY as [number, number, number],
      font: FONTS.FAMILY,
      fontSize: FONTS.SIZE_TABLE,
      halign: 'center',
    },
    bodyStyles: {
      font: FONTS.FAMILY,
      fontSize: FONTS.SIZE_TABLE,
      halign: 'center',
    },
    footStyles: {
      font: FONTS.FAMILY,
      fontSize: FONTS.SIZE_TABLE,
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  return getLastAutoTableY(doc) + 10;
};

// ─── Cost Breakdown Table ────────────────────────────────

const drawCostTable = async (doc: jsPDF, result: QuoteResult, yPos: number, currency: CurrencyMode = 'both', showUSD: boolean = true): Promise<number> => {
  const exchangeRate = result.totalQuoteAmountUSD > 0
    ? result.totalQuoteAmount / result.totalQuoteAmountUSD
    : 1400;
  const fmtAmt = (krw: number) => {
    if (currency === 'usd' || (!showUSD && currency === 'both')) return pdfFormatUSD(krw / exchangeRate); // This case shouldn't happen with showUSD=false
    return pdfFormatKRW(krw);
  };
  const amountHeader = (currency === 'usd') ? 'Amount (USD)' : 'Amount (KRW)';
  const autoTable = (await import('jspdf-autotable')).default;

  doc.setFont(FONTS.FAMILY, 'normal');
  doc.setFontSize(FONTS.SIZE_SUBHEADER);
  doc.setTextColor(...COLORS.PRIMARY);
  doc.text('Cost Breakdown', MARGIN_X, yPos);
  yPos = nextLine(yPos, 4);

  const bd = result.breakdown;
  const rows: (string | number)[][] = [];

  const packingTotal = bd.packingMaterial + bd.packingLabor + bd.packingFumigation + bd.handlingFees;
  if (packingTotal > 0) {
    rows.push(['Packing & Handling', fmtAmt(packingTotal)]);
    if (bd.packingMaterial > 0) rows.push(['  Material', fmtAmt(bd.packingMaterial)]);
    if (bd.packingLabor > 0) rows.push(['  Labor', fmtAmt(bd.packingLabor)]);
    if (bd.packingFumigation > 0) rows.push(['  Fumigation', fmtAmt(bd.packingFumigation)]);
    if (bd.handlingFees > 0) rows.push(['  Handling', fmtAmt(bd.handlingFees)]);
  }
  if (bd.pickupInSeoul > 0) rows.push(['Seoul Pickup', fmtAmt(bd.pickupInSeoul)]);
  rows.push([`International Freight (${result.carrier})`, fmtAmt(bd.intlBase)]);
  if (bd.intlFsc > 0) rows.push(['Fuel Surcharge (FSC)', fmtAmt(bd.intlFsc)]);
  // Individual surcharge rows from appliedSurcharges (V2)
  if (bd.appliedSurcharges && bd.appliedSurcharges.length > 0) {
    bd.appliedSurcharges.forEach((s) => {
      const label = s.name;
      const suffix = s.chargeType === 'rate' ? ` (${s.amount}%)` : '';
      rows.push([`  ${label}${suffix}`, fmtAmt(s.appliedAmount)]);
    });
    if ((bd.intlManualSurge ?? 0) > 0) {
      rows.push(['  Manual Surge', fmtAmt(bd.intlManualSurge!)]);
    }
  } else {
    // Backward compat: single row for legacy quotes without appliedSurcharges
    if (bd.intlWarRisk > 0) rows.push(['War Risk Surcharge', fmtAmt(bd.intlWarRisk)]);
    if (bd.intlSurge > 0) rows.push(['Surcharge', fmtAmt(bd.intlSurge)]);
  }
  // Carrier add-on services (DHL/UPS): SGF, EXT, RMT, etc.
  if (bd.carrierAddOnDetails && bd.carrierAddOnDetails.length > 0) {
    rows.push([`${result.carrier} Add-on Services`, fmtAmt(bd.carrierAddOnTotal || 0)]);
    bd.carrierAddOnDetails.forEach((d) => {
      const fscNote = d.fscAmount > 0 ? ' +FSC' : '';
      rows.push([`  ${d.nameEn} (${d.code})${fscNote}`, fmtAmt(d.amount + d.fscAmount)]);
    });
  }
  if (bd.destDuty > 0) rows.push(['Duty & Tax (Est.)', fmtAmt(bd.destDuty)]);

  autoTable(doc, {
    startY: yPos,
    head: [['Item', amountHeader]],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.PRIMARY as [number, number, number],
      font: FONTS.FAMILY,
      fontSize: FONTS.SIZE_TABLE,
    },
    bodyStyles: {
      font: FONTS.FAMILY,
      fontSize: FONTS.SIZE_TABLE,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 100 },
      1: { halign: 'right' },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  return getLastAutoTableY(doc) + 8;
};

// ─── Quote Summary Box ───────────────────────────────────

const drawQuoteSummary = (doc: jsPDF, input: QuoteInput, result: QuoteResult, yPos: number, currency: CurrencyMode = 'both', showUSD: boolean = true): number => {
  doc.setFont(FONTS.FAMILY, 'normal');

  // E-MAX Red summary box
  doc.setFillColor(...COLORS.PRIMARY);
  doc.roundedRect(MARGIN_X, yPos, CONTENT_WIDTH, 35, 3, 3, 'F');

  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(FONTS.SIZE_SUBHEADER);
  doc.text('Total Quote', MARGIN_X + 8, yPos + 10);

  doc.setFontSize(20);
  if (currency === 'usd') {
    doc.text(pdfFormatUSD(result.totalQuoteAmountUSD), MARGIN_X + 8, yPos + 23);
  } else {
    doc.text(pdfFormatKRW(result.totalQuoteAmount), MARGIN_X + 8, yPos + 23);
  }

  doc.setFontSize(FONTS.SIZE_NORMAL);
  if (currency === 'both' && showUSD) {
    doc.text(`(Approx.${pdfFormatUSD(result.totalQuoteAmountUSD)})`, MARGIN_X + 8, yPos + 30);
  } else if (currency === 'usd' && showUSD) {
    doc.text(`(Approx.${pdfFormatKRW(result.totalQuoteAmount)})`, MARGIN_X + 8, yPos + 30);
  }

  // Right side info
  const rightX = PAGE_WIDTH - MARGIN_X - 8;
  doc.setFontSize(FONTS.SIZE_SMALL);
  doc.text(`Carrier: ${result.carrier}`, rightX, yPos + 10, { align: 'right' });
  doc.text(`Zone: ${result.appliedZone}`, rightX, yPos + 17, { align: 'right' });
  doc.text(`Transit: ${result.transitTime}`, rightX, yPos + 24, { align: 'right' });
  doc.text(`Incoterm: ${input.incoterm}`, rightX, yPos + 31, { align: 'right' });

  return yPos + 45;
};

// ─── Warnings ────────────────────────────────────────────

const drawWarnings = (doc: jsPDF, warnings: string[], yPos: number): number => {
  if (warnings.length === 0) return yPos;

  doc.setFont(FONTS.FAMILY, 'normal');
  doc.setTextColor(...COLORS.WARNING);
  doc.setFontSize(FONTS.SIZE_SMALL);
  doc.text('Warnings:', MARGIN_X, yPos);
  yPos = nextLine(yPos, 5);

  warnings.forEach(w => {
    doc.text(`• ${w}`, MARGIN_X + 3, yPos);
    yPos = nextLine(yPos, 5);
  });

  return nextLine(yPos, 5);
};

// ─── Disclaimer ─────────────────────────────────────────

const drawDisclaimer = (doc: jsPDF, yPos: number): number => {
  doc.setFont(FONTS.FAMILY, 'normal');
  doc.setFontSize(FONTS.SIZE_SMALL);
  doc.setTextColor(...COLORS.TEXT_LIGHT);

  const disclaimerEn = 'This quotation is valid within the stated period. Surcharges are subject to change at time of booking.';
  const rateDate = `Rates as of: ${new Date().toLocaleDateString('en-US')}`;

  doc.text(disclaimerEn, MARGIN_X, yPos);
  yPos = nextLine(yPos, 4);
  doc.text(rateDate, MARGIN_X, yPos);

  return nextLine(yPos, 6);
};

// ─── Footer ──────────────────────────────────────────────

const drawFooter = (doc: jsPDF) => {
  doc.setFont(FONTS.FAMILY, 'normal');
  const pageHeight = doc.internal.pageSize.height;

  doc.setDrawColor(...COLORS.PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, pageHeight - 28, PAGE_WIDTH - MARGIN_X, pageHeight - 28);

  doc.setFontSize(FONTS.SIZE_SMALL);
  doc.setTextColor(...COLORS.TEXT_LIGHT);
  doc.text(
    'This quote is an estimate based on provided dimensions and is subject to change upon final measurement.',
    MARGIN_X,
    pageHeight - 20
  );

  // Page number
  doc.text(
    `Page ${doc.getCurrentPageInfo().pageNumber}`,
    PAGE_WIDTH - MARGIN_X,
    pageHeight - 12,
    { align: 'right' }
  );
};

// ─── Build Filename ──────────────────────────────────────

const buildFilename = (prefix: string, referenceNo?: string): string => {
  const date = new Date().toISOString().slice(0, 10);
  const ref = referenceNo || 'DRAFT';
  return `${prefix}_${ref}_${date}.pdf`;
};

// ─── Public: Generate Single Quote PDF ───────────────────

export const generatePDF = async (
  input: QuoteInput,
  result: QuoteResult,
  referenceNo?: string,
  options?: { isAdmin?: boolean; isKorean?: boolean; showUSD?: boolean }
) => {
  const showUSD = options?.showUSD ?? true;
  const currency: CurrencyMode = options?.isAdmin ? 'both' : (options?.isKorean ? 'krw' : 'usd');
  const { jsPDF: JsPDF } = await import('jspdf');
  const doc = new JsPDF();

  await loadKoreanFont(doc);

  const validityDate = referenceNo
    ? new Date(Date.now() + 7 * 86400000).toLocaleDateString('ko-KR')
    : undefined;

  let yPos = 20;
  yPos = drawHeader(doc, yPos, referenceNo, validityDate);
  yPos = drawShipmentDetails(doc, input, yPos);
  const carrier = input.overseasCarrier || 'UPS';
  const volDivisor = carrier === 'EMAX' ? 6000 : 5000;
  yPos = await drawCargoTable(doc, input.items, result, yPos, input.packingType, volDivisor);
  doc.setFont(FONTS.FAMILY, 'normal');
  yPos = await drawCostTable(doc, result, yPos, currency, showUSD);
  doc.setFont(FONTS.FAMILY, 'normal');
  yPos = drawQuoteSummary(doc, input, result, yPos, currency, showUSD);
  yPos = drawWarnings(doc, result.warnings, yPos);
  drawDisclaimer(doc, yPos);
  drawFooter(doc);

  doc.save(buildFilename('EMAX_Quote', referenceNo));
};

// ─── Public: Generate Carrier Comparison PDF ─────────────

export const generateComparisonPDF = async (
  input: QuoteInput,
  upsResult: QuoteResult,
  dhlResult: QuoteResult,
  emaxResult?: QuoteResult,
  options?: { showUSD?: boolean }
) => {
  const showUSD = options?.showUSD ?? true;
  const { jsPDF: JsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new JsPDF();

  await loadKoreanFont(doc);

  const comparisonValidityDate = new Date(Date.now() + 7 * 86400000).toLocaleDateString('ko-KR');

  let yPos = 20;

  // Header
  yPos = drawHeader(doc, yPos, undefined, comparisonValidityDate);
  doc.setFontSize(FONTS.SIZE_SUBHEADER);
  doc.setTextColor(...COLORS.PRIMARY);
  doc.text('캐리어 비교 / Carrier Comparison Report', MARGIN_X, yPos);
  yPos = nextLine(yPos, 10);

  // Shipment info
  yPos = drawShipmentDetails(doc, input, yPos);
  yPos = await drawCargoTable(doc, input.items, upsResult, yPos, input.packingType);
  doc.setFont(FONTS.FAMILY, 'normal');

  // Comparison table
  const carriers = emaxResult ? ['UPS', 'DHL', 'EMAX'] : ['UPS', 'DHL'];
  const results = emaxResult ? [upsResult, dhlResult, emaxResult] : [upsResult, dhlResult];
  const amounts = results.map(r => r.totalQuoteAmount);
  const minAmount = Math.min(...amounts);

  const headRow = ['항목', ...carriers];
  const bodyRows = [
    ['Zone', ...results.map(r => r.appliedZone)],
    ['Transit Time', ...results.map(r => r.transitTime)],
    ['청구중량 (kg)', ...results.map(r => formatNum(r.billableWeight))],
    ['포장/핸들링', ...results.map(r => pdfFormatKRW(
      r.breakdown.packingMaterial + r.breakdown.packingLabor + r.breakdown.packingFumigation + r.breakdown.handlingFees
    ))],
    ['국제운송', ...results.map(r => pdfFormatKRW(
      r.breakdown.intlBase + r.breakdown.intlFsc + r.breakdown.intlWarRisk + r.breakdown.intlSurge
    ))],
    ['총 비용', ...results.map(r => pdfFormatKRW(r.breakdown.totalCost))],
    ['견적가 (KRW)', ...results.map(r => pdfFormatKRW(r.totalQuoteAmount))],
  ];

  if (showUSD) {
    bodyRows.push(['견적가 (USD)', ...results.map(r => pdfFormatUSD(r.totalQuoteAmountUSD))]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [headRow],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.PRIMARY as [number, number, number],
      font: FONTS.FAMILY,
      fontSize: FONTS.SIZE_TABLE,
      halign: 'center',
    },
    bodyStyles: {
      font: FONTS.FAMILY,
      fontSize: FONTS.SIZE_TABLE,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 55 },
    },
    didParseCell: (data: import('jspdf-autotable').CellHookData) => {
      // Highlight cheapest carrier in the quote row
      if (data.row.index === 6 && data.column.index > 0) {
        const carrierIdx = data.column.index - 1;
        if (amounts[carrierIdx] === minAmount) {
          data.cell.styles.textColor = COLORS.PRIMARY;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });

  yPos = getLastAutoTableY(doc) + 10;
  doc.setFont(FONTS.FAMILY, 'normal');

  // Savings note
  if (amounts.filter(a => a !== minAmount).length > 0) {
    const cheapestIdx = amounts.indexOf(minAmount);
    const expensiveAmount = Math.max(...amounts);
    const savings = expensiveAmount - minAmount;
    doc.setFontSize(FONTS.SIZE_NORMAL);
    doc.setTextColor(...COLORS.PRIMARY);
    doc.text(
      `→ ${carriers[cheapestIdx]}가 최저가: ${pdfFormatKRW(savings)} 절감${showUSD ? ` (Approx.${pdfFormatUSD(savings / input.exchangeRate)})` : ''}`,
      MARGIN_X,
      yPos
    );
    yPos = nextLine(yPos, 10);
  }

  drawDisclaimer(doc, yPos);
  drawFooter(doc);
  doc.save(buildFilename('EMAX_Comparison'));
};
