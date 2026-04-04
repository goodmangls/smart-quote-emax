# Seed DHL and UPS add-on rates
# Run: rails runner db/seeds/addon_rates.rb

puts "Seeding addon rates..."

dhl_rates = [
  { code: "SAT", carrier: "DHL", name_en: "Saturday Delivery", name_ko: "토요일 배송",
    charge_type: "fixed", unit: "shipment", amount: 60_000,
    fsc_applicable: true, selectable: true, sort_order: 1 },

  { code: "ELR", carrier: "DHL", name_en: "Elevated Risk Area", name_ko: "분쟁지역 (Elevated Risk)",
    charge_type: "fixed", unit: "shipment", amount: 50_000,
    fsc_applicable: true, selectable: true, sort_order: 2,
    description: "IL, UA, RU 등 분쟁 위험 지역" },

  { code: "OWT", carrier: "DHL", name_en: "Over Weight (>70kg/carton)", name_ko: "과중량 (70kg 초과)",
    charge_type: "per_carton", unit: "carton", amount: 150_000,
    fsc_applicable: true, auto_detect: true, selectable: false, sort_order: 3,
    description: "카톤당 실무게/볼륨 무게 70kg 초과",
    detect_rules: { "weight_threshold" => 70 } },

  { code: "INS", carrier: "DHL", name_en: "Shipment Insurance", name_ko: "물품 안심 발송 (보험)",
    charge_type: "calculated", unit: "shipment", amount: 17_000,
    min_amount: 17_000, rate_percent: 1.0,
    fsc_applicable: false, selectable: true, sort_order: 4,
    description: "물품 신고가의 1% 또는 최소 17,000원" },

  { code: "DOC", carrier: "DHL", name_en: "Document Insurance", name_ko: "서류 안심 발송",
    charge_type: "fixed", unit: "shipment", amount: 8_000,
    fsc_applicable: false, selectable: true, sort_order: 5 },

  { code: "RES", carrier: "DHL", name_en: "Residential Delivery", name_ko: "주거지역 배송",
    charge_type: "fixed", unit: "shipment", amount: 8_000,
    fsc_applicable: true, selectable: true, sort_order: 6 },

  { code: "SIG", carrier: "DHL", name_en: "Direct Signature", name_ko: "직접 서명",
    charge_type: "fixed", unit: "shipment", amount: 8_000,
    fsc_applicable: false, selectable: true, sort_order: 7 },

  { code: "NDS", carrier: "DHL", name_en: "Non-Document Shipment (NDS)", name_ko: "NDS (3자무역)",
    charge_type: "fixed", unit: "shipment", amount: 8_000,
    fsc_applicable: false, selectable: true, sort_order: 8 },

  { code: "RMT", carrier: "DHL", name_en: "Remote Area Surcharge", name_ko: "외곽 요금",
    charge_type: "calculated", unit: "shipment", amount: 35_000,
    min_amount: 35_000, per_kg_rate: 750,
    fsc_applicable: true, selectable: true, sort_order: 9,
    description: "최소 35,000원 또는 KG당 750원 중 큰 값" },

  { code: "ADC", carrier: "DHL", name_en: "Address Correction", name_ko: "주소 정정",
    charge_type: "fixed", unit: "shipment", amount: 17_000,
    fsc_applicable: false, selectable: true, sort_order: 10 },

  { code: "IRR", carrier: "DHL", name_en: "Non Conveyable Piece (Irregular)", name_ko: "비정형 화물 (Irregular)",
    charge_type: "per_piece", unit: "piece", amount: 30_000,
    fsc_applicable: true, selectable: true, sort_order: 11,
    description: "정형화된 종이/carton box가 아닌 화물" },

  { code: "ASR", carrier: "DHL", name_en: "Adult Signature Required", name_ko: "성인 서명 (Adult)",
    charge_type: "fixed", unit: "shipment", amount: 8_000,
    fsc_applicable: false, selectable: true, sort_order: 12 },

  { code: "OSP", carrier: "DHL", name_en: "Oversize Piece", name_ko: "대형 화물 (Oversize)",
    charge_type: "per_piece", unit: "piece", amount: 30_000,
    fsc_applicable: true, auto_detect: true, selectable: false, sort_order: 13,
    description: "최대 긴 변 >100cm 또는 두 번째 긴 변 >80cm",
    detect_rules: { "max_longest" => 100, "max_second" => 80 } },

  # --- 2026-03-17 추가: DHL Korea 공식 부가서비스 페이지 기준 ---
  { code: "EMG", carrier: "DHL", name_en: "Emergency Situation Surcharge", name_ko: "비상 상황 추가요금",
    charge_type: "fixed", unit: "shipment", amount: 0,
    fsc_applicable: true, selectable: true, sort_order: 14,
    description: "DHL이 통제할 수 없는 비상 상황 발생 시 적용 (금액 변동)" },

  { code: "TSD", carrier: "DHL", name_en: "Trade Sanctions Delivery", name_ko: "무역 제재국 배송",
    charge_type: "fixed", unit: "shipment", amount: 50_000,
    fsc_applicable: true, selectable: true, sort_order: 15,
    description: "UN 제재 국가 배송 (IR, KP, LY, SO)" },

  { code: "NSC", carrier: "DHL", name_en: "Non-Stackable Cargo", name_ko: "상단 적재 불가 화물",
    charge_type: "fixed", unit: "shipment", amount: 440_000,
    fsc_applicable: true, selectable: true, sort_order: 16,
    description: "팔레트 상단 적재 불가 (25kg 이상 팔레트만 적용)" },

  { code: "MWB", carrier: "DHL", name_en: "Manual Waybill Entry", name_ko: "수기 운송장 발행",
    charge_type: "fixed", unit: "shipment", amount: 15_000,
    fsc_applicable: false, selectable: true, sort_order: 17 },

  { code: "LBI", carrier: "DHL", name_en: "Lithium Ion Battery (PI966 Sec II)", name_ko: "리튬 이온 배터리",
    charge_type: "fixed", unit: "shipment", amount: 10_000,
    fsc_applicable: false, selectable: true, sort_order: 18,
    description: "리튬 이온 배터리 포함 물품" },

  { code: "LBM", carrier: "DHL", name_en: "Lithium Metal Battery (PI969 Sec II)", name_ko: "리튬 메탈 배터리",
    charge_type: "fixed", unit: "shipment", amount: 10_000,
    fsc_applicable: false, selectable: true, sort_order: 19,
    description: "리튬 메탈 배터리 포함 물품" },
]

ups_rates = [
  { code: "RES", carrier: "UPS", name_en: "Residential Delivery", name_ko: "주거지역 서비스",
    charge_type: "fixed", unit: "shipment", amount: 4_600,
    fsc_applicable: true, selectable: true, sort_order: 1 },

  { code: "RMT", carrier: "UPS", name_en: "Remote Area Surcharge", name_ko: "외곽요금",
    charge_type: "calculated", unit: "shipment", amount: 31_400,
    min_amount: 31_400, per_kg_rate: 570,
    fsc_applicable: true, selectable: true, sort_order: 2,
    description: "최소 31,400원 또는 KG당 570원 중 큰 값" },

  { code: "EXT", carrier: "UPS", name_en: "Extended Area Surcharge", name_ko: "원거리지역 서비스",
    charge_type: "calculated", unit: "shipment", amount: 34_200,
    min_amount: 34_200, per_kg_rate: 640,
    fsc_applicable: true, selectable: true, sort_order: 3,
    description: "최소 34,200원 또는 KG당 640원 중 큰 값" },

  { code: "AHS", carrier: "UPS", name_en: "Additional Handling", name_ko: "비규격품부가요금",
    charge_type: "per_carton", unit: "carton", amount: 21_400,
    fsc_applicable: true, auto_detect: true, selectable: false, sort_order: 4,
    description: "AHS Weight(>25kg) 또는 AHS Dim(L>122cm, W>76cm) 또는 특수포장",
    detect_rules: { "weight_threshold" => 25, "max_longest" => 122, "max_second" => 76, "packing_types" => ["WOODEN_BOX", "SKID"] } },

  { code: "ADC", carrier: "UPS", name_en: "Address Correction", name_ko: "주소정정",
    charge_type: "per_carton", unit: "carton", amount: 15_100,
    fsc_applicable: false, selectable: true, sort_order: 5 },

  { code: "DDP", carrier: "UPS", name_en: "DDP Service Fee", name_ko: "DDP 수수료",
    charge_type: "fixed", unit: "shipment", amount: 28_500,
    fsc_applicable: false, auto_detect: true, selectable: false, sort_order: 6,
    condition: "DDP",
    description: "DDP incoterm 선택 시 자동 부과" },
]

(dhl_rates + ups_rates).each do |attrs|
  AddonRate.find_or_initialize_by(carrier: attrs[:carrier], code: attrs[:code]).tap do |r|
    r.assign_attributes(attrs.merge(effective_from: Date.new(2026, 1, 1), is_active: true, created_by: "seed"))
    r.save!
    puts "  #{r.carrier}/#{r.code}: #{r.name_en} — #{r.amount.to_i} KRW"
  end
end

puts "Done! #{AddonRate.count} addon rates seeded."
