/**
 * UPS Korea 부가서비스 요금표 (2026년)
 * Source: UPS Korea 공식 부가서비스 가이드
 */

import { PackingType } from '@/types';

export interface UpsAddOn {
  code: string;
  nameKo: string;
  nameEn: string;
  amount: number;
  chargeType: 'fixed' | 'per_carton' | 'calculated';
  unit: 'shipment' | 'carton';
  fscApplicable: boolean;
  autoDetect?: boolean;
  selectable: boolean;
  condition?: string;
  description?: string;
}

export const UPS_ADDON_RATES: UpsAddOn[] = [
  {
    code: 'RES',
    nameKo: '주거지역 서비스',
    nameEn: 'Residential Delivery',
    amount: 4_600,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
  },
  {
    code: 'RMT',
    nameKo: '외곽요금',
    nameEn: 'Remote Area Surcharge',
    amount: 31_400,
    chargeType: 'calculated',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    description: '최소 31,400원 또는 KG당 570원 중 큰 값',
  },
  {
    code: 'EXT',
    nameKo: '원거리지역 서비스',
    nameEn: 'Extended Area Surcharge',
    amount: 34_200,
    chargeType: 'calculated',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    description: '최소 34,200원 또는 KG당 640원 중 큰 값',
  },
  {
    code: 'AHS',
    nameKo: '비규격품부가요금',
    nameEn: 'Additional Handling',
    amount: 21_400,
    chargeType: 'per_carton',
    unit: 'carton',
    fscApplicable: true,
    autoDetect: true,
    selectable: false,
    description: 'AHS Weight(>25kg) 또는 AHS Dim(L>122cm, W>76cm) 또는 특수포장',
  },
  {
    code: 'ADC',
    nameKo: '주소정정',
    nameEn: 'Address Correction',
    amount: 15_100,
    chargeType: 'per_carton',
    unit: 'carton',
    fscApplicable: false,
    selectable: true,
  },
  {
    code: 'DDP',
    nameKo: 'DDP 수수료',
    nameEn: 'DDP Service Fee',
    amount: 28_500,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    autoDetect: true,
    selectable: false,
    condition: 'DDP',
    description: 'DDP incoterm 선택 시 자동 부과',
  },
];

/** UPS Remote Area: max(31,400, billableWeight * 570) */
export const calculateUpsRemoteAreaFee = (billableWeight: number): number =>
  Math.max(31_400, Math.ceil(billableWeight) * 570);

/** UPS Extended Area: max(34,200, billableWeight * 640) */
export const calculateUpsExtendedAreaFee = (billableWeight: number): number =>
  Math.max(34_200, Math.ceil(billableWeight) * 640);

/**
 * UPS Surge Fee (급증 수수료) - 2026-03-15부터 별도 공지 시까지
 * Source: UPS Korea 급증 수수료 공지 (2026-03-14 업데이트)
 * 한국 출발 수출 화물 → Middle East / Israel 도착지
 * Billable weight(kg) 기준, FSC 적용됨, 중복 적용 가능
 */
export const UPS_SURGE_FEE_COUNTRIES = {
  /** Israel: KRW 4,722/kg */
  ISRAEL: ['IL'] as string[],
  /** Middle East: KRW 2,004/kg */
  MIDDLE_EAST: [
    'AF', 'BH', 'BD', 'EG', 'IQ', 'JO', 'KW', 'LB',
    'NP', 'OM', 'PK', 'QA', 'SA', 'LK', 'AE',
  ] as string[],
};

export const UPS_SURGE_FEE_RATES: Record<string, number> = {
  ISRAEL: 4_722,      // KRW per kg
  MIDDLE_EAST: 2_004, // KRW per kg
};

/** 목적지 국가에 해당하는 UPS Surge Fee (KRW/kg) 반환. 해당 없으면 null */
export const getUpsSurgeFeePerKg = (destinationCountry: string): { rate: number; region: string } | null => {
  if (UPS_SURGE_FEE_COUNTRIES.ISRAEL.includes(destinationCountry)) {
    return { rate: UPS_SURGE_FEE_RATES.ISRAEL, region: 'Israel' };
  }
  if (UPS_SURGE_FEE_COUNTRIES.MIDDLE_EAST.includes(destinationCountry)) {
    return { rate: UPS_SURGE_FEE_RATES.MIDDLE_EAST, region: 'Middle East' };
  }
  return null;
};

/** UPS AHS 감지: weight>25kg OR longest>122cm OR 2nd>76cm OR wood/skid packing */
export const isUpsAdditionalHandling = (
  l: number, w: number, h: number, weight: number, packingType: PackingType
): boolean => {
  const sorted = [l, w, h].sort((a, b) => b - a);
  return (
    weight > 25 ||
    sorted[0] > 122 ||
    sorted[1] > 76 ||
    [PackingType.WOODEN_BOX, PackingType.SKID].includes(packingType)
  );
};
