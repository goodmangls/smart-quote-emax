export enum Incoterm {
  EXW = 'EXW',
  FOB = 'FOB',
  CNF = 'C&F',
  CIF = 'CIF',
  DAP = 'DAP',
  DDP = 'DDP',
}

export enum PackingType {
  NONE = 'NONE',
  WOODEN_BOX = 'WOODEN_BOX', // Standard Export Packing
  SKID = 'SKID',
  VACUUM = 'VACUUM',
}

export interface CargoItem {
  id: string;
  width: number; // cm
  length: number; // cm
  height: number; // cm
  weight: number; // kg per box
  quantity: number;
}

export interface QuoteInput {
  originCountry: string;
  destinationCountry: string;
  destinationZip: string;
  incoterm: Incoterm;
  shippingMode?: 'Door-to-Door' | 'Door-to-Airport';
  packingType: PackingType;
  items: CargoItem[];
  discountPercent: number; // Target discount in % (default 0, 정가 그대로)
  dutyTaxEstimate: number; // For DDP only

  // Market Variables
  exchangeRate: number; // KRW per USD
  fscPercent: number; // Fuel Surcharge %
  overseasCarrier?: 'UPS' | 'DHL' | 'EMAX' | 'FEDEX' | 'OCS';

  // Manual Overrides
  manualPackingCost?: number; // Optional manual override for packing & docs
  manualSurgeCost?: number; // Optional manual surge/AHS cost (auto-calc disabled)
  pickupInSeoulCost?: number; // Extra cost for pick-up in Seoul (KRW)

  // DHL Add-on Services
  dhlAddOns?: string[]; // Selected DHL add-on codes (e.g. ['SAT', 'RES'])
  dhlDeclaredValue?: number; // Declared value for insurance calculation (KRW)

  // Quote validity
  validityDays?: number; // Default quote validity in days (default 7)

  // UPS Add-on Services
  upsAddOns?: string[]; // Selected UPS add-on codes (e.g. ['RES', 'RMT'])

  // DB-driven surcharges (resolved from API, applied in calculateQuote)
  resolvedSurcharges?: Array<{
    code: string;
    name: string;
    nameKo: string | null;
    chargeType: 'fixed' | 'rate';
    amount: number; // KRW for fixed, % for rate
    sourceUrl: string | null;
  }>;

  // DB-driven add-on rates (resolved from API, replaces hardcoded dhl_addons/ups_addons)
  resolvedAddonRates?: Array<{
    code: string;
    carrier: 'DHL' | 'UPS';
    nameEn: string;
    nameKo: string;
    chargeType: 'fixed' | 'per_piece' | 'per_carton' | 'calculated';
    unit: 'shipment' | 'piece' | 'carton';
    amount: number;
    perKgRate: number | null;
    ratePercent: number | null;
    minAmount: number | null;
    fscApplicable: boolean;
    autoDetect: boolean;
    selectable: boolean;
    condition: string | null;
    detectRules: Record<string, number | string[]> | null;
  }>;
}

export interface CostBreakdown {
  packingMaterial: number;
  packingLabor: number;
  packingFumigation: number;
  handlingFees: number; // Customs, Docs
  pickupInSeoul: number; // Extra cost for pick-up in Seoul (KRW)
  intlBase: number; // Carrier base rate (UPS/DHL/EMAX)
  intlFsc: number; // Fuel Surcharge (0 for EMAX)
  intlWarRisk: number; // War risk surcharge (0 for EMAX)
  intlSurge: number; // Combined surge total (system + manual)
  intlSystemSurcharge?: number; // DB-driven surcharges (auto-calculated)
  intlManualSurge?: number; // User-entered manual surge override
  carrierAddOnTotal?: number; // Carrier add-on services total (DHL/UPS)
  carrierAddOnDetails?: Array<{
    code: string;
    nameKo: string;
    nameEn: string;
    amount: number;
    fscAmount: number;
  }>;
  appliedSurcharges?: Array<{
    code: string;
    name: string;
    nameKo?: string;
    chargeType: 'fixed' | 'rate';
    amount: number;
    appliedAmount: number;
    sourceUrl?: string;
  }>;
  destDuty: number;
  totalCost: number;
}

export interface QuoteResult {
  totalQuoteAmount: number; // Final Customer Price (KRW)
  totalQuoteAmountUSD: number; // Final Customer Price (USD)
  totalCostAmount: number; // Internal Cost (KRW)
  discountAmount: number;
  discountPercent: number;
  currency: string;

  // Details for logic transparency
  totalActualWeight: number;
  totalVolumetricWeight: number;
  billableWeight: number;
  appliedZone: string;
  transitTime: string;
  carrier: string; // 'UPS' | 'DHL' | 'EMAX' | 'FEDEX'
  warnings: string[];
  // Input echo — preserves the FSC% the user applied so displays/PDF match exactly without derive-from-amount rounding (see CostBreakdownCard).
  fscPercent: number;

  breakdown: CostBreakdown;
}

// ── Quote History Types ──

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'confirmed' | 'expired';

export interface QuoteSummary {
  id: number;
  referenceNo: string;
  destinationCountry: string;
  totalQuoteAmount: number;
  totalQuoteAmountUSD: number;
  discountPercent: number;
  billableWeight: number;
  domesticTruckType?: string;
  status: QuoteStatus;
  validityDate: string | null;
  surchargeStale?: boolean;
  createdAt: string;
}

export interface QuoteDetail {
  id: number;
  referenceNo: string;
  status: QuoteStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Input
  originCountry: string;
  destinationCountry: string;
  destinationZip: string;
  domesticRegionCode: string;
  isJejuPickup: boolean;
  incoterm: string;
  packingType: string;
  dutyTaxEstimate: number;
  exchangeRate: number;
  fscPercent: number;
  manualDomesticCost: number | null;
  manualPackingCost: number | null;
  overseasCarrier?: string;
  items: CargoItem[];
  // Result
  totalQuoteAmount: number;
  totalQuoteAmountUSD: number;
  totalCostAmount: number;
  discountAmount: number;
  discountPercent: number;
  billableWeight: number;
  appliedZone: string;
  domesticTruckType?: string;
  warnings: string[];
  breakdown: CostBreakdown;
  validityDate: string | null;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export interface QuoteListResponse {
  quotes: QuoteSummary[];
  pagination: Pagination;
}

export interface QuoteListParams {
  page?: number;
  perPage?: number;
  q?: string;
  destinationCountry?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: QuoteStatus;
}
