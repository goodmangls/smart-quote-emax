/**
 * DHL Express Korea 부가서비스 요금표 (2026년)
 * Source: DHL Express Korea 공식 부가서비스 가이드
 */

export interface DhlAddOn {
  code: string;
  nameKo: string;
  nameEn: string;
  amount: number;            // KRW (fixed amount or base for calculated)
  chargeType: 'fixed' | 'per_piece' | 'per_carton' | 'calculated';
  unit: 'shipment' | 'piece' | 'carton';
  fscApplicable: boolean;    // true if fuel surcharge applies on top
  autoDetect?: boolean;      // true if auto-detected from cargo dimensions/weight
  selectable: boolean;       // true if user can toggle on/off
  description?: string;
}

export const DHL_ADDON_RATES: DhlAddOn[] = [
  {
    code: 'SAT',
    nameKo: '토요일 배송',
    nameEn: 'Saturday Delivery',
    amount: 60_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
  },
  {
    code: 'ELR',
    nameKo: '분쟁지역 (Elevated Risk)',
    nameEn: 'Elevated Risk Area',
    amount: 50_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    description: 'IL, UA, RU 등 분쟁 위험 지역',
  },
  {
    code: 'OWT',
    nameKo: '과중량 (70kg 초과)',
    nameEn: 'Over Weight (>70kg/carton)',
    amount: 150_000,
    chargeType: 'per_carton',
    unit: 'carton',
    fscApplicable: true,
    autoDetect: true,
    selectable: false,
    description: '카톤당 실무게/볼륨 무게 70kg 초과',
  },
  {
    code: 'INS',
    nameKo: '물품 안심 발송 (보험)',
    nameEn: 'Shipment Insurance',
    amount: 17_000,
    chargeType: 'calculated',
    unit: 'shipment',
    fscApplicable: false,
    selectable: true,
    description: '물품 신고가의 1% 또는 최소 17,000원',
  },
  {
    code: 'DOC',
    nameKo: '서류 안심 발송',
    nameEn: 'Document Insurance',
    amount: 8_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    selectable: true,
  },
  {
    code: 'RES',
    nameKo: '주거지역 배송',
    nameEn: 'Residential Delivery',
    amount: 8_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
  },
  {
    code: 'SIG',
    nameKo: '직접 서명',
    nameEn: 'Direct Signature',
    amount: 8_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    selectable: true,
  },
  {
    code: 'NDS',
    nameKo: 'NDS (3자무역)',
    nameEn: 'Non-Document Shipment (NDS)',
    amount: 8_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    selectable: true,
  },
  {
    code: 'RMT',
    nameKo: '외곽 요금',
    nameEn: 'Remote Area Surcharge',
    amount: 35_000,
    chargeType: 'calculated',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    description: '최소 35,000원 또는 KG당 750원 중 큰 값',
  },
  {
    code: 'ADC',
    nameKo: '주소 정정',
    nameEn: 'Address Correction',
    amount: 17_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    selectable: true,
  },
  {
    code: 'IRR',
    nameKo: '비정형 화물 (Irregular)',
    nameEn: 'Non Conveyable Piece (Irregular)',
    amount: 30_000,
    chargeType: 'per_piece',
    unit: 'piece',
    fscApplicable: true,
    selectable: true,
    description: '정형화된 종이/carton box가 아닌 화물',
  },
  {
    code: 'ASR',
    nameKo: '성인 서명 (Adult)',
    nameEn: 'Adult Signature Required',
    amount: 8_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    selectable: true,
  },
  {
    code: 'OSP',
    nameKo: '대형 화물 (Oversize)',
    nameEn: 'Oversize Piece',
    amount: 30_000,
    chargeType: 'per_piece',
    unit: 'piece',
    fscApplicable: true,
    autoDetect: true,
    selectable: false,
    description: '최대 긴 변 >100cm 또는 두 번째 긴 변 >80cm',
  },
  {
    code: 'EMG',
    nameKo: '비상 상황 추가요금',
    nameEn: 'Emergency Situation Surcharge',
    amount: 0,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    description: 'DHL이 통제할 수 없는 비상 상황 발생 시 적용 (금액 변동)',
  },
  {
    code: 'TSD',
    nameKo: '무역 제재국 배송',
    nameEn: 'Trade Sanctions Delivery',
    amount: 50_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    description: 'UN 제재 국가 배송 (IR, KP, LY, SO)',
  },
  {
    code: 'NSC',
    nameKo: '상단 적재 불가 화물',
    nameEn: 'Non-Stackable Cargo',
    amount: 440_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: true,
    selectable: true,
    description: '팔레트 상단 적재 불가 (25kg 이상 팔레트만 적용)',
  },
  {
    code: 'MWB',
    nameKo: '수기 운송장 발행',
    nameEn: 'Manual Waybill Entry',
    amount: 15_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    selectable: true,
  },
  {
    code: 'LBI',
    nameKo: '리튬 이온 배터리',
    nameEn: 'Lithium Ion Battery (PI966 Sec II)',
    amount: 10_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    selectable: true,
    description: '리튬 이온 배터리 포함 물품',
  },
  {
    code: 'LBM',
    nameKo: '리튬 메탈 배터리',
    nameEn: 'Lithium Metal Battery (PI969 Sec II)',
    amount: 10_000,
    chargeType: 'fixed',
    unit: 'shipment',
    fscApplicable: false,
    selectable: true,
    description: '리튬 메탈 배터리 포함 물품',
  },
];

/** DHL Oversize Piece (OSP) 판정: longest >100cm OR 2nd longest >80cm */
export const isDhlOversizePiece = (l: number, w: number, h: number): boolean => {
  const sorted = [l, w, h].sort((a, b) => b - a);
  return sorted[0] > 100 || sorted[1] > 80;
};

/** DHL Over Weight 판정: >70kg per carton */
export const isDhlOverWeight = (weight: number): boolean => weight > 70;

/** Remote Area 금액 계산: max(35,000, billableWeight * 750) */
export const calculateRemoteAreaFee = (billableWeight: number): number =>
  Math.max(35_000, Math.ceil(billableWeight) * 750);

/** Insurance 금액 계산: max(declaredValue * 0.01, 17,000) */
export const calculateInsuranceFee = (declaredValue: number): number =>
  Math.max(declaredValue * 0.01, 17_000);
