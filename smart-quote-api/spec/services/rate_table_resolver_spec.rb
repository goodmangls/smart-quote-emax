# frozen_string_literal: true

require "rails_helper"

RSpec.describe Calculators::RateTableResolver do
  it "uses UPS Document table within 5kg" do
    result = described_class.call(
      carrier: "UPS",
      shipping_item_type: "DOCUMENT",
      billable_weight: 1
    )
    expect(result[:used_document]).to eq(true)
    expect(result[:exact]).to eq(Constants::UpsTariff::UPS_DOC_EXACT_RATES)
  end

  it "falls back to UPS Non-Document above 5kg" do
    result = described_class.call(
      carrier: "UPS",
      shipping_item_type: "DOCUMENT",
      billable_weight: 5.1
    )
    expect(result[:used_document]).to eq(false)
    expect(result[:exact]).to eq(Constants::UpsTariff::UPS_EXACT_RATES)
  end

  it "uses DHL Document table within 2kg" do
    result = described_class.call(
      carrier: "DHL",
      shipping_item_type: "DOCUMENT",
      billable_weight: 2
    )
    expect(result[:used_document]).to eq(true)
    expect(result[:exact]).to eq(Constants::DhlTariff::DHL_DOC_EXACT_RATES)
  end

  it "uses FedEx Envelope for Document ≤0.5kg" do
    result = described_class.call(
      carrier: "FEDEX",
      shipping_item_type: "DOCUMENT",
      billable_weight: 0.5
    )
    expect(result[:used_document]).to eq(true)
    expect(result[:exact]).to eq(Constants::FedexTariff::FEDEX_ENVELOPE_EXACT_RATES)
  end

  it "uses FedEx Pak for Document ≤2.5kg" do
    result = described_class.call(
      carrier: "FEDEX",
      shipping_item_type: "DOCUMENT",
      billable_weight: 1.5
    )
    expect(result[:used_document]).to eq(true)
    expect(result[:exact]).to eq(Constants::FedexTariff::FEDEX_PAK_EXACT_RATES)
  end

  it "falls back to FedEx IP above 2.5kg Document" do
    result = described_class.call(
      carrier: "FEDEX",
      shipping_item_type: "DOCUMENT",
      billable_weight: 3
    )
    expect(result[:used_document]).to eq(false)
    expect(result[:exact]).to eq(Constants::FedexTariff::FEDEX_EXACT_RATES)
  end
end

RSpec.describe Calculators::UpsCost, "document rates" do
  it "returns Document rate for JP 1kg" do
    result = described_class.call(
      billable_weight: 1,
      country: "JP",
      fsc_percent: 40.5,
      shipping_item_type: "DOCUMENT"
    )
    expect(result[:intl_base]).to eq(30_134)
  end

  it "returns Non-Document rate when type omitted" do
    # 이 예제의 주제는 "타입 생략 시 비서류로 떨어지는가" 이지 요율 숫자 자체가 아니다.
    # 숫자를 복제하면 요율 개정 때마다 깨지므로 선택 동작을 직접 비교하고,
    # 값은 요율표 상수에 바인딩한다(기존 55_784 는 어느 요율표에도 없는 값이었다).
    omitted  = described_class.call(billable_weight: 1, country: "JP", fsc_percent: 40.5)
    explicit = described_class.call(billable_weight: 1, country: "JP", fsc_percent: 40.5,
                                    shipping_item_type: "NON_DOCUMENT")
    document = described_class.call(billable_weight: 1, country: "JP", fsc_percent: 40.5,
                                    shipping_item_type: "DOCUMENT")

    expect(omitted[:intl_base]).to eq(explicit[:intl_base])
    expect(omitted[:intl_base]).not_to eq(document[:intl_base])
    expect(omitted[:intl_base]).to eq(Constants::UpsTariff::UPS_EXACT_RATES["Z2"][1])
  end
end

RSpec.describe Calculators::FedexCost do
  it "returns Envelope rate for SG Document 0.5kg" do
    result = described_class.call(
      billable_weight: 0.5,
      country: "SG",
      fsc_percent: 39.75,
      shipping_item_type: "DOCUMENT"
    )
    expect(result[:intl_base]).to eq(24_060)
    expect(result[:applied_zone]).to include("Singapore")
  end

  it "returns IP rate for JP Parcel 1.0kg" do
    result = described_class.call(
      billable_weight: 1.0,
      country: "JP",
      fsc_percent: 39.75,
      shipping_item_type: "NON_DOCUMENT"
    )
    # 기존 기대값 76_900 은 FEDEX_EXACT_RATES 어느 zone·중량에도 존재하지 않는
    # 숫자였다. Japan 은 rate_key "ZP" 로 해석되므로 요율표에 바인딩한다.
    expect(result[:intl_base]).to eq(Constants::FedexTariff::FEDEX_EXACT_RATES["ZP"][1])
    expect(result[:applied_zone]).to include("Japan")
  end
end
