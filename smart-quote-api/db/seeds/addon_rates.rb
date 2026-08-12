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
    description: "리튬 메탈 배터리 포함 물품" }
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
    detect_rules: { "weight_threshold" => 25, "max_longest" => 122, "max_second" => 76, "packing_types" => [ "WOODEN_BOX", "SKID" ] } },

  { code: "ADC", carrier: "UPS", name_en: "Address Correction", name_ko: "주소정정",
    charge_type: "per_carton", unit: "carton", amount: 15_100,
    fsc_applicable: false, selectable: true, sort_order: 5 },

  { code: "DDP", carrier: "UPS", name_en: "DDP Service Fee", name_ko: "DDP 수수료",
    charge_type: "fixed", unit: "shipment", amount: 28_500,
    fsc_applicable: false, auto_detect: true, selectable: false, sort_order: 6,
    condition: "DDP",
    description: "DDP incoterm 선택 시 자동 부과" }
]

# FedEx — "추가 서비스 요금 및 기타 정보 — 대한민국" (KR_20251119_102313), IPE/IP/IE.
#
# The five 비표준화물 codes are seeded for admin visibility and rate overrides, but the
# selection logic stays in Calculators::FedexAddon: FedEx charges only the highest of
# them per package rather than the sum, and a package meeting the 용적 criteria is rated
# at a 18kg minimum. Neither rule can be expressed in an AddonRate row.
fedex_rates = [
  { code: "AHD", carrier: "FEDEX", name_en: "Additional Handling – Dimension", name_ko: "추가 취급 요금 – 용적",
    charge_type: "fixed", unit: "piece", amount: 35_600,
    fsc_applicable: true, auto_detect: true, selectable: false, sort_order: 1,
    description: "가장 긴 면 >121cm, 두 번째 면 >76cm, 길이+둘레 >266cm, 용적 >169,901cm³ 중 하나. 최소 청구 중량 18kg 동반",
    detect_rules: { "max_longest" => 121, "max_second" => 76, "max_length_girth" => 266, "max_volume" => 169_901 } },

  { code: "AHW", carrier: "FEDEX", name_en: "Additional Handling – Weight", name_ko: "추가 취급 요금 – 중량",
    charge_type: "fixed", unit: "piece", amount: 35_600,
    fsc_applicable: true, auto_detect: true, selectable: false, sort_order: 2,
    description: "실제 중량 25kg 초과", detect_rules: { "weight_threshold" => 25 } },

  { code: "AHP", carrier: "FEDEX", name_en: "Additional Handling – Packaging", name_ko: "추가 취급 요금 – 패키징",
    charge_type: "fixed", unit: "piece", amount: 35_600,
    fsc_applicable: true, auto_detect: true, selectable: false, sort_order: 3,
    description: "골판지 외 재질(금속·목재 등), 압축/신축 포장, 원통형, 끈 부착 등",
    detect_rules: { "packing_types" => [ "WOODEN_BOX", "SKID" ] } },

  { code: "OVR", carrier: "FEDEX", name_en: "Oversize Charge", name_ko: "특대형 화물 취급 요금",
    charge_type: "fixed", unit: "piece", amount: 86_000,
    fsc_applicable: true, auto_detect: true, selectable: false, sort_order: 4,
    description: "가장 긴 면 >243cm, 길이+둘레 >330cm, 실제 중량 >50kg, 용적 >283,168cm³ 중 하나",
    detect_rules: { "max_longest" => 243, "max_length_girth" => 330, "weight_threshold" => 50, "max_volume" => 283_168 } },

  { code: "UNA", carrier: "FEDEX", name_en: "Unauthorized Package Charge", name_ko: "미허가 패키지 처리 추가 요금",
    charge_type: "fixed", unit: "piece", amount: 378_200,
    fsc_applicable: true, auto_detect: true, selectable: false, sort_order: 5,
    description: "가장 긴 면 >274cm, 길이+둘레 >419cm, 실제 중량 >68kg 중 하나",
    detect_rules: { "max_longest" => 274, "max_length_girth" => 419, "weight_threshold" => 68 } },

  { code: "USI", carrier: "FEDEX", name_en: "U.S. Import Processing Fee", name_ko: "미국 수입 처리 수수료",
    charge_type: "fixed", unit: "shipment", amount: 3_900,
    fsc_applicable: false, auto_detect: true, selectable: false, sort_order: 6,
    description: "미국으로 수입되는 모든 국제 발송건" },

  { code: "SPU", carrier: "FEDEX", name_en: "Saturday Pickup", name_ko: "토요일 픽업",
    charge_type: "fixed", unit: "shipment", amount: 20_100,
    fsc_applicable: true, selectable: true, sort_order: 7 },

  { code: "SDL", carrier: "FEDEX", name_en: "Saturday Delivery", name_ko: "토요일 배달",
    charge_type: "fixed", unit: "shipment", amount: 20_100,
    fsc_applicable: true, selectable: true, sort_order: 8 },

  { code: "RES", carrier: "FEDEX", name_en: "Residential Delivery", name_ko: "거주지 배달",
    charge_type: "fixed", unit: "shipment", amount: 4_400,
    fsc_applicable: true, selectable: true, sort_order: 9,
    description: "Freight 이외 발송 건당. ODA 적용 화물에는 중복 부과되지 않음" },

  { code: "ADR", carrier: "FEDEX", name_en: "Address Correction", name_ko: "주소 정정 및 변경 요금",
    charge_type: "fixed", unit: "shipment", amount: 14_600,
    fsc_applicable: true, selectable: true, sort_order: 10 },

  { code: "TPC", carrier: "FEDEX", name_en: "Third Party Consignee", name_ko: "Third Party Consignee(제3자 수취인)",
    charge_type: "fixed", unit: "shipment", amount: 14_200,
    fsc_applicable: true, selectable: true, sort_order: 11 },

  { code: "DIC", carrier: "FEDEX", name_en: "Dry Ice", name_ko: "드라이아이스 추가 요금",
    charge_type: "fixed", unit: "shipment", amount: 6_600,
    fsc_applicable: true, selectable: true, sort_order: 12,
    description: "위험물과 함께인 경우 위험물 요금만 부과됨" },

  { code: "SIG", carrier: "FEDEX", name_en: "Indirect Signature Required", name_ko: "간접서명",
    charge_type: "fixed", unit: "shipment", amount: 4_000,
    fsc_applicable: true, selectable: true, sort_order: 13,
    description: "미국·캐나다 개인 거주지 도착, 총 운송신고액 미화 500달러 미만" },

  { code: "SDS", carrier: "FEDEX", name_en: "Direct Signature Required", name_ko: "직접서명",
    charge_type: "fixed", unit: "shipment", amount: 4_600,
    fsc_applicable: true, selectable: true, sort_order: 14 },

  { code: "SAS", carrier: "FEDEX", name_en: "Adult Signature Required", name_ko: "성인서명",
    charge_type: "fixed", unit: "shipment", amount: 5_800,
    fsc_applicable: true, selectable: true, sort_order: 15 },

  { code: "DGA", carrier: "FEDEX", name_en: "Accessible Dangerous Goods", name_ko: "근접 위험물",
    charge_type: "calculated", unit: "shipment", amount: 152_100,
    min_amount: 152_100, per_kg_rate: 2_360,
    fsc_applicable: true, selectable: true, sort_order: 16,
    description: "발송 건당 152,100원 또는 kg당 2,360원 중 큰 금액" },

  { code: "DGI", carrier: "FEDEX", name_en: "Inaccessible Dangerous Goods", name_ko: "비근접 위험물",
    charge_type: "calculated", unit: "shipment", amount: 93_800,
    min_amount: 93_800, per_kg_rate: 1_320,
    fsc_applicable: true, selectable: true, sort_order: 17,
    description: "발송 건당 93,800원 또는 kg당 1,320원 중 큰 금액" },

  { code: "BRK", carrier: "FEDEX", name_en: "Broker Select Option", name_ko: "도착지 브로커 지정 수수료",
    charge_type: "calculated", unit: "shipment", amount: 13_600,
    min_amount: 13_600, per_kg_rate: 1_540,
    fsc_applicable: true, selectable: true, sort_order: 18,
    description: "발송 건당 13,600원 또는 kg당 1,540원 중 큰 금액" }
]

(dhl_rates + ups_rates + fedex_rates).each do |attrs|
  AddonRate.find_or_initialize_by(carrier: attrs[:carrier], code: attrs[:code]).tap do |r|
    r.assign_attributes(attrs.merge(effective_from: Date.new(2026, 1, 1), is_active: true, created_by: "seed"))
    r.save!
    puts "  #{r.carrier}/#{r.code}: #{r.name_en} — #{r.amount.to_i} KRW"
  end
end

puts "Done! #{AddonRate.count} addon rates seeded."
