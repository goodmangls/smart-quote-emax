FactoryBot.define do
  factory :quote do
    user
    sequence(:reference_no) { |n| "SQ-#{Time.current.year}-#{n.to_s.rjust(4, '0')}" }
    origin_country { "KR" }
    destination_country { "US" }
    destination_zip { "10001" }
    domestic_region_code { "A" }
    is_jeju_pickup { false }
    incoterm { "FOB" }
    packing_type { "NONE" }
    discount_percent { 15.0 }
    duty_tax_estimate { 0 }
    exchange_rate { 1300.0 }
    fsc_percent { 27.5 }
    manual_domestic_cost { nil }
    manual_packing_cost { nil }

    items do
      [
        {
          "description" => "Electronic Parts",
          "quantity" => 2,
          "weightPerItem" => 5.0,
          "lengthCm" => 40,
          "widthCm" => 30,
          "heightCm" => 20
        }
      ]
    end

    total_quote_amount { 1_500_000 }
    total_quote_amount_usd { 1_153.85 }
    total_cost_amount { 1_200_000 }
    discount_amount { 300_000 }
    applied_discount_percent { 15.0 }
    billable_weight { 10.0 }
    applied_zone { "Z5" }
    domestic_truck_type { "1t Truck" }

    breakdown do
      {
        "domesticBase" => 50_000,
        "domesticSurcharge" => 0,
        "packingMaterial" => 0,
        "packingLabor" => 0,
        "packingFumigation" => 0,
        "handlingFees" => 15_000,
        "upsBase" => 800_000,
        "upsFsc" => 220_000,
        "upsWarRisk" => 5_000,
        "upsSurge" => 10_000,
        "destDuty" => 0,
        "totalCost" => 1_100_000
      }
    end

    warnings { [] }
    status { "draft" }
    notes { nil }

    trait :sent do
      status { "sent" }
    end

    trait :accepted do
      status { "accepted" }
    end

    trait :with_dap do
      incoterm { "DDP" }
      duty_tax_estimate { 50_000 }
    end

    trait :with_packing do
      packing_type { "WOODEN_BOX" }
    end
  end
end
