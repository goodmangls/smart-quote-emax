require 'rails_helper'

# Per-box billable weight (E-MAX confirmed for 2+ boxes):
#   total_billable_weight = Σᵢ roundToHalf(max(actualᵢ, volumetricᵢ)) × quantity
# Mirrors the frontend calculationService.ts unit tests (A/B/D).
RSpec.describe Calculators::ItemCost do
  def call(items, divisor)
    described_class.call(items: items, packing_type: "NONE", volumetric_divisor: divisor)
  end

  it "sums per-box chargeable for multi-box mixed density (/5000)" do
    # A 50×40×30 wt5 → vol 12, max(5,12)=12 → 12
    # B 10×10×10 wt20 → vol 0.2, max(20,0.2)=20 → 20  ⇒ 32
    result = call([
      { length: 50, width: 40, height: 30, weight: 5, quantity: 1 },
      { length: 10, width: 10, height: 10, weight: 20, quantity: 1 }
    ], 5000)
    expect(result[:total_billable_weight]).to eq(32.0)
    # legacy totals remain available, unchanged
    expect(result[:total_actual_weight]).to eq(25.0)
  end

  it "rounds each box up to 0.5kg across quantity (/5000)" do
    # 30×20×15 wt1 → vol 1.8, max(1,1.8)=1.8 → roundToHalf 2.0; ×3 = 6.0
    result = call([ { length: 30, width: 20, height: 15, weight: 1, quantity: 3 } ], 5000)
    expect(result[:total_billable_weight]).to eq(6.0)
  end

  it "uses the EMAX /6000 divisor for per-box chargeable" do
    # A 60×50×40 wt1 → vol 20, max(1,20)=20 → 20
    # B 10×10×10 wt30 → vol ≈0.167, max(30,0.167)=30 → 30  ⇒ 50
    result = call([
      { length: 60, width: 50, height: 40, weight: 1, quantity: 1 },
      { length: 10, width: 10, height: 10, weight: 30, quantity: 1 }
    ], 6000)
    expect(result[:total_billable_weight]).to eq(50.0)
  end
end
