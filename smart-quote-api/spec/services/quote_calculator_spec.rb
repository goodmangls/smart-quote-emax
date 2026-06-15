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

  it "applies EMAX CN FSC at 1,360 KRW/kg for 2026-06-16 through 2026-07-15" do
    result = described_class.call(base([
      { length: 30, width: 20, height: 15, weight: 10, quantity: 1 }
    ]).merge(overseasCarrier: "EMAX", destinationCountry: "CN"))

    expect(result[:billableWeight]).to eq(10.0)
    expect(result[:breakdown][:intlFsc]).to eq(13_600)
  end

  it "applies EMAX VN FSC at 1,420 KRW/kg for 2026-06-16 through 2026-07-15" do
    result = described_class.call(base([
      { length: 30, width: 20, height: 15, weight: 10, quantity: 1 }
    ]).merge(overseasCarrier: "EMAX", destinationCountry: "VN"))

    expect(result[:billableWeight]).to eq(10.0)
    expect(result[:breakdown][:intlFsc]).to eq(14_200)
  end
end
