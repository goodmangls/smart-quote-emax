require 'rails_helper'

# Verifies the billable-weight selection in QuoteCalculator#calculate_items:
#   - multi-box (2+ physical boxes): per-box chargeable sum (total_billable_weight)
#   - single box (Σ quantity == 1): legacy max(Σ actual, Σ volumetric), unchanged
# Mirrors frontend calculationService.ts tests A (multi) and C (single).
RSpec.describe QuoteCalculator do
  def base(items)
    {
      overseasCarrier: "UPS",
      destinationCountry: "US",
      incoterm: "DAP",
      packingType: "NONE",
      discountPercent: 0,
      dutyTaxEstimate: 0,
      exchangeRate: 1300,
      fscPercent: 30,
      items: items
    }
  end

  it "applies per-box billable for multi-box mixed density" do
    # A 50×40×30 wt5 → 12, B 10×10×10 wt20 → 20  ⇒ billable 32 (legacy would be 25)
    result = described_class.call(base([
      { length: 50, width: 40, height: 30, weight: 5, quantity: 1 },
      { length: 10, width: 10, height: 10, weight: 20, quantity: 1 }
    ]))
    expect(result[:billableWeight]).to eq(32.0)
  end

  it "keeps legacy raw max-of-totals for a single box" do
    # 30×20×15 wt1 → vol 1.8, max(1,1.8)=1.8 (single box: no per-box rounding)
    result = described_class.call(base([
      { length: 30, width: 20, height: 15, weight: 1, quantity: 1 }
    ]))
    expect(result[:billableWeight]).to be_within(1e-9).of(1.8)
  end

  # EMAX FSC 는 15일 주기로 바뀌고 EMAX_FSC_PER_KG 는 이력 없이 현재 값만 담는다.
  # 특정 기간의 숫자(1,360 / 1,420)를 박아두면 다음 개정에서 반드시 깨진다 —
  # 실제로 2026-07-16 개정 이후 이 두 예제가 그렇게 깨져 있었다.
  # 여기서 검증할 것은 요율값 자체가 아니라 "per-kg 요율 × 청구중량" 파이프라인이므로
  # 기대값을 상수에 바인딩한다. 요율값의 정확성은 FSC 갱신 워크플로가 담당한다.
  %w[CN VN].each do |country|
    it "applies EMAX #{country} FSC as per-kg rate x billable weight" do
      result = described_class.call(base([
        { length: 30, width: 20, height: 15, weight: 10, quantity: 1 }
      ]).merge(overseasCarrier: "EMAX", destinationCountry: country))

      per_kg = Constants::EmaxTariff::EMAX_FSC_PER_KG.fetch(country)

      expect(result[:billableWeight]).to eq(10.0)
      expect(result[:breakdown][:intlFsc]).to eq(per_kg * 10)
    end
  end
end
