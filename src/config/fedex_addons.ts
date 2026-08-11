/**
 * FedEx Korea 부가서비스 요금표 (2026년)
 * Source: FedEx "추가 서비스 요금 및 기타 정보 — 대한민국" (KR_20251119_102313)
 *         수출 및 ImportOne 서비스, IPE/IP/IE (패키지) 기준
 *
 * 범위: 패키지 서비스(IPE/IP/IE)만. Freight(IPF/IEF) 요금과 계약 기반 프리미엄
 * (M&I, Priority Alert, ODC), 지역 그룹 기반 OPA/ODA 는 이 파일에 없다.
 * OPA/ODA 는 그룹 A/B/C 국가 목록이 원문에 없어 데이터가 오기 전까지 보류.
 */

import { PackingType } from '@/types';

export interface FedexAddOn {
  code: string;
  nameKo: string;
  nameEn: string;
  amount: number;
  chargeType: 'fixed' | 'calculated';
  unit: 'shipment' | 'package';
  fscApplicable: boolean;
  autoDetect?: boolean;
  selectable: boolean;
  condition?: string;
  description?: string;
}

// ── 비표준화물 최소 청구 중량 ──────────────────────────────────────────────

/**
 * 추가 취급 요금 - 용적 조건에 해당하면 청구 중량이 18kg 아래로 내려가지 않는다.
 * 부가요금이 정액이므로 이 값은 **base 요율 조회**에 작용한다(요금 줄 하나가 아님).
 * 특대형·미허가 요금이 대신 부과되는 경우에도 용적 조건에 해당하면 함께 적용된다.
 */
export const FEDEX_MIN_CHARGEABLE_WEIGHT_KG = 18;

// ── 비표준화물 판정 임계값 ────────────────────────────────────────────────

/** 길이 + 둘레 = 가장 긴 면 + (나머지 두 면 × 2). FedEx 표기 "길이 + 폭×2 + 높이×2". */
export const lengthPlusGirth = (l: number, w: number, h: number): number => {
  const [longest, second, third] = [l, w, h].sort((a, b) => b - a);
  return longest + second * 2 + third * 2;
};

export const FEDEX_AHS_DIMENSION = {
  maxLongestCm: 121,
  maxSecondCm: 76,
  maxLengthGirthCm: 266,
  maxVolumeCm3: 169_901,
} as const;

export const FEDEX_AHS_WEIGHT_KG = 25;

export const FEDEX_OVERSIZE = {
  maxLongestCm: 243,
  maxLengthGirthCm: 330,
  maxWeightKg: 50,
  maxVolumeCm3: 283_168,
} as const;

export const FEDEX_UNAUTHORIZED = {
  maxLongestCm: 274,
  maxLengthGirthCm: 419,
  maxWeightKg: 68,
} as const;

/** 골판지 외 재질(금속·목재 등)·끈 부착 등 → 추가 취급 요금 – 패키징 대상. */
const FEDEX_AHS_PACKAGING_TYPES: PackingType[] = [PackingType.WOODEN_BOX, PackingType.SKID];

/** 추가 취급 요금 – 용적 조건 해당 여부. 18kg 최소 청구 중량의 트리거이기도 하다. */
export const isFedexAhsDimension = (l: number, w: number, h: number): boolean => {
  const sorted = [l, w, h].sort((a, b) => b - a);
  return (
    sorted[0] > FEDEX_AHS_DIMENSION.maxLongestCm ||
    sorted[1] > FEDEX_AHS_DIMENSION.maxSecondCm ||
    lengthPlusGirth(l, w, h) > FEDEX_AHS_DIMENSION.maxLengthGirthCm ||
    l * w * h > FEDEX_AHS_DIMENSION.maxVolumeCm3
  );
};

export const isFedexAhsWeight = (weight: number): boolean => weight > FEDEX_AHS_WEIGHT_KG;

export const isFedexAhsPackaging = (packingType: PackingType): boolean =>
  FEDEX_AHS_PACKAGING_TYPES.includes(packingType);

export const isFedexOversize = (l: number, w: number, h: number, weight: number): boolean => {
  const sorted = [l, w, h].sort((a, b) => b - a);
  return (
    sorted[0] > FEDEX_OVERSIZE.maxLongestCm ||
    lengthPlusGirth(l, w, h) > FEDEX_OVERSIZE.maxLengthGirthCm ||
    weight > FEDEX_OVERSIZE.maxWeightKg ||
    l * w * h > FEDEX_OVERSIZE.maxVolumeCm3
  );
};

export const isFedexUnauthorized = (l: number, w: number, h: number, weight: number): boolean => {
  const sorted = [l, w, h].sort((a, b) => b - a);
  return (
    sorted[0] > FEDEX_UNAUTHORIZED.maxLongestCm ||
    lengthPlusGirth(l, w, h) > FEDEX_UNAUTHORIZED.maxLengthGirthCm ||
    weight > FEDEX_UNAUTHORIZED.maxWeightKg
  );
};

/** 비표준화물 요금 코드 — 아래 highest-only 규칙의 대상. */
export const FEDEX_NON_STANDARD_CODES = ['AHD', 'AHW', 'AHP', 'OVR', 'UNA'] as const;
export type FedexNonStandardCode = (typeof FEDEX_NON_STANDARD_CODES)[number];

// ── 요금표 ────────────────────────────────────────────────────────────────

export const FEDEX_ADDON_RATES: FedexAddOn[] = [
  // 비표준화물 (자동 감지) — 2종 이상 해당 시 가장 높은 금액 하나만 부과된다.
  {
    code: 'AHD',
    nameKo: '추가 취급 요금 – 용적',
    nameEn: 'Additional Handling – Dimension',
    amount: 35_600,
    chargeType: 'fixed',
    unit: 'package',
    fscApplicable: true,
    autoDetect: true,
    selectable: false,
    condition: '가장 긴 면 >121cm, 두 번째 면 >76cm, 길이+둘레 >266cm, 용적 >169,901cm³ 중 하나',
    description: '해당 시 최소 청구 중량 18kg 이 함께 적용됩니다.',
  },
  {
    code: 'AHW',
    nameKo: '추가 취급 요금 – 중량',
    nameEn: 'Additional Handling – Weight',
    amount: 35_600,
    chargeType: 'fixed',
    unit: 'package',
    fscApplicable: true,
    autoDetect: true,
    selectable: false,
    condition: '실제 중량 >25kg',
  },
  {
    code: 'AHP',
    nameKo: '추가 취급 요금 – 패키징',
    nameEn: 'Additional Handling – Packaging',
    amount: 35_600,
    chargeType: 'fixed',
    unit: 'package',
    fscApplicable: true,
    autoDetect: true,
    selectable: false,
    condition: '골판지 외 재질(금속·목재·천·가죽·플라스틱 등), 압축/신축 포장, 원통형, 끈 부착 등',
  },
  {
    code: 'OVR',
    nameKo: '특대형 화물 취급 요금',
    nameEn: 'Oversize Charge',
    amount: 86_000,
    chargeType: 'fixed',
    unit: 'package',
    fscApplicable: true,
    autoDetect: true,
    selectable: false,
    condition: '가장 긴 면 >243cm, 길이+둘레 >330cm, 실제 중량 >50kg, 용적 >283,168cm³ 중 하나',
  },
  {
    code: 'UNA',
    nameKo: '미허가 패키지 처리 추가 요금',
    nameEn: 'Unauthorized Package Charge',
    amount: 378_200,
    chargeType: 'fixed',
    unit: 'package',
    fscApplicable: true,
    autoDetect: true,
    selectable: false,
    condition: '가장 긴 면 >274cm, 길이+둘레 >419cm, 실제 중량 >68kg 중 하나',
  },

  // 목적지 기반 (자동 감지)
  {
    code: 'USI',
    nameKo: '미국 수입 처리 수수료',
    nameEn: 'U.S. Import Processing Fee',
    amount: 3_900,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    autoDetect: true,
    selectable: false,
    condition: '미국으로 수입되는 모든 국제 발송건',
  },

  // 사용자 선택 — 정액
  {
    code: 'SPU',
    nameKo: '토요일 픽업',
    nameEn: 'Saturday Pickup',
    amount: 20_100,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
  },
  {
    code: 'SDL',
    nameKo: '토요일 배달',
    nameEn: 'Saturday Delivery',
    amount: 20_100,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
  },
  {
    code: 'RES',
    nameKo: '거주지 배달',
    nameEn: 'Residential Delivery',
    amount: 4_400,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    condition: 'Freight 이외 발송 건당. ODA 적용 화물에는 중복 부과되지 않습니다.',
  },
  {
    code: 'ADR',
    nameKo: '주소 정정 및 변경 요금',
    nameEn: 'Address Correction',
    amount: 14_600,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
  },
  {
    code: 'TPC',
    nameKo: 'Third Party Consignee(제3자 수취인)',
    nameEn: 'Third Party Consignee',
    amount: 14_200,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
  },
  {
    code: 'DIC',
    nameKo: '드라이아이스 추가 요금',
    nameEn: 'Dry Ice',
    amount: 6_600,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    condition: '위험물(근접/비근접)과 함께인 경우 위험물 요금만 부과되고 드라이아이스는 부과되지 않습니다.',
  },
  {
    code: 'SIG',
    nameKo: '간접서명',
    nameEn: 'Indirect Signature Required',
    amount: 4_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    condition: '미국·캐나다 개인 거주지 도착, 총 운송신고액 미화 500달러 미만인 Freight 이외 화물',
  },
  {
    code: 'SDS',
    nameKo: '직접서명',
    nameEn: 'Direct Signature Required',
    amount: 4_600,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    condition: '미국·캐나다 개인 거주지 도착, 총 운송신고액 미화 500달러 미만인 화물',
  },
  {
    code: 'SAS',
    nameKo: '성인서명',
    nameEn: 'Adult Signature Required',
    amount: 5_800,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    condition: 'Freight 이외 화물 1건당',
  },

  // 사용자 선택 — 둘 중 큰 금액 (calcAddonFee 의 calculated + perKgRate + minAmount 경로)
  {
    code: 'DGA',
    nameKo: '근접 위험물',
    nameEn: 'Accessible Dangerous Goods',
    amount: 152_100,
    chargeType: 'calculated',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    condition: '발송 건당 152,100원 또는 kg당 2,360원 중 큰 금액',
  },
  {
    code: 'DGI',
    nameKo: '비근접 위험물',
    nameEn: 'Inaccessible Dangerous Goods',
    amount: 93_800,
    chargeType: 'calculated',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    condition: '발송 건당 93,800원 또는 kg당 1,320원 중 큰 금액',
  },
  {
    code: 'BRK',
    nameKo: '도착지 브로커 지정 수수료',
    nameEn: 'Broker Select Option',
    amount: 13_600,
    chargeType: 'calculated',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    condition: '발송 건당 13,600원 또는 kg당 1,540원 중 큰 금액',
  },
];

/** 둘 중 큰 금액 계산에 쓰이는 kg 단가·하한 (calcAddonFee 의 perKgRate/minAmount). */
export const FEDEX_HARDCODED_DEFAULTS: Record<
  string,
  { perKgRate: number | null; minAmount: number | null }
> = {
  DGA: { perKgRate: 2_360, minAmount: 152_100 },
  DGI: { perKgRate: 1_320, minAmount: 93_800 },
  BRK: { perKgRate: 1_540, minAmount: 13_600 },
};

// ── 운송 신고 금액(Declared Value) 추가 비용 ──────────────────────────────

export const FEDEX_DECLARED_VALUE_FREE_LIMIT_KRW = 115_000;
export const FEDEX_DECLARED_VALUE_STEP_KRW = 115_000;
export const FEDEX_DECLARED_VALUE_FEE_PER_STEP_KRW = 1_420;

/**
 * 운송 신고 금액이 115,000원을 초과하면 115,000원당 1,420원(끝자리 절상).
 * 한도 이하이면 0원.
 */
export const calculateFedexDeclaredValueFee = (declaredValueKrw: number): number => {
  if (!declaredValueKrw || declaredValueKrw <= FEDEX_DECLARED_VALUE_FREE_LIMIT_KRW) return 0;
  const steps = Math.ceil(declaredValueKrw / FEDEX_DECLARED_VALUE_STEP_KRW);
  return steps * FEDEX_DECLARED_VALUE_FEE_PER_STEP_KRW;
};
