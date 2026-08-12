require "rails_helper"

# Mirrors src/features/quote/services/fedexAddonCalculator.test.ts. The two suites are
# kept case-for-case because a rule implemented on only one side produces a saved quote
# that disagrees with the PDF the customer was sent.
RSpec.describe Calculators::CarrierAddonCost, "FedEx add-ons" do
  def item(over = {})
    { id: "1", length: 40.0, width: 30.0, height: 30.0, weight: 10.0, quantity: 1 }.merge(over)
  end

  def input(over = {})
    { destinationCountry: "JP", packingType: "NONE", items: [ item ] }.merge(over)
  end

  # All-positional on purpose: with no keyword parameters, Ruby 3 passes a trailing
  # hash such as `result(items: [...])` as the positional override rather than
  # raising "unknown keyword".
  def result(over = {}, weight = 10, fsc = 0)
    i = input(over)
    described_class.call(
      carrier: "FEDEX", items: i[:items], packing_type: i[:packingType],
      billable_weight: weight, fsc_percent: fsc,
      fedex_add_ons: i[:fedexAddOns] || [], fedex_declared_value: i[:fedexDeclaredValue] || 0,
      destination_country: i[:destinationCountry]
    )
  end

  def codes(over = {})
    result(over)[:details].map { |d| d[:code] }
  end

  describe "an ordinary package attracts nothing" do
    it { expect(result[:total]).to eq(0) }
    it { expect(codes).to be_empty }
  end

  describe "추가 취급 요금 – 용적 (AHD)" do
    it "가장 긴 면 >121cm" do
      expect(codes(items: [ item(length: 122.0) ])).to include("AHD")
      expect(codes(items: [ item(length: 121.0) ])).not_to include("AHD")
    end

    it "두 번째로 긴 면 >76cm" do
      expect(codes(items: [ item(length: 100.0, width: 77.0, height: 6.0) ])).to include("AHD")
      expect(codes(items: [ item(length: 100.0, width: 76.0, height: 6.0) ])).not_to include("AHD")
    end

    it "길이+둘레 >266cm" do
      expect(codes(items: [ item(length: 100.0, width: 60.0, height: 24.0) ])).to include("AHD")
      expect(codes(items: [ item(length: 100.0, width: 60.0, height: 23.0) ])).not_to include("AHD")
    end

    it "용적 >169,901cm³" do
      expect(codes(items: [ item(length: 88.0, width: 44.0, height: 44.0) ])).to include("AHD")
      expect(codes(items: [ item(length: 88.0, width: 44.0, height: 43.0) ])).not_to include("AHD")
    end

    it "charges 35,600원 per package and multiplies by quantity" do
      expect(result(items: [ item(length: 122.0) ])[:total]).to eq(35_600)
      expect(result(items: [ item(length: 122.0, quantity: 3) ])[:total]).to eq(35_600 * 3)
    end
  end

  describe "추가 취급 요금 – 중량 / 패키징" do
    it "실제 중량 >25kg → AHW" do
      expect(codes(items: [ item(weight: 26.0) ])).to include("AHW")
      expect(codes(items: [ item(weight: 25.0) ])).not_to include("AHW")
    end

    it "목재/스키드 → AHP, 진공은 아님" do
      expect(codes(packingType: "WOODEN_BOX")).to include("AHP")
      expect(codes(packingType: "SKID")).to include("AHP")
      expect(codes(packingType: "VACUUM")).not_to include("AHP")
    end
  end

  describe "highest-only — 2종 이상 해당 시 가장 높은 금액 하나만" do
    it "charges Oversize alone rather than Oversize + AHD" do
      r = result(items: [ item(length: 250.0) ])
      expect(r[:details].length).to eq(1)
      expect(r[:details].first[:code]).to eq("OVR")
      expect(r[:total]).to eq(86_000)
    end

    it "charges Unauthorized alone when all three tiers are met" do
      r = result(items: [ item(length: 300.0, weight: 70.0) ])
      expect(r[:details].length).to eq(1)
      expect(r[:total]).to eq(378_200)
    end

    it "never sums two 35,600원 lines for one package" do
      r = result(items: [ item(length: 122.0, weight: 30.0) ])
      expect(r[:details].length).to eq(1)
      expect(r[:total]).to eq(35_600)
    end

    it "resolves per package, so a mixed shipment can carry two codes" do
      r = result(items: [ item(length: 250.0), item(id: "2", weight: 30.0) ])
      expect(r[:details].map { |d| d[:code] }.sort).to eq(%w[AHW OVR])
    end
  end

  describe ".min_chargeable_weight" do
    it "is nil when nothing meets the 용적 criteria" do
      expect(described_class.fedex_min_chargeable_weight([ item ], "NONE")).to be_nil
    end

    it "is 18kg for one triggering package and scales with quantity" do
      expect(described_class.fedex_min_chargeable_weight([ item(length: 122.0) ], "NONE")).to eq(18)
      expect(described_class.fedex_min_chargeable_weight([ item(length: 122.0, quantity: 3) ], "NONE")).to eq(54)
    end

    it "counts only the triggering boxes in a mixed shipment" do
      expect(described_class.fedex_min_chargeable_weight([ item(length: 122.0), item(id: "2") ], "NONE")).to eq(18)
    end
  end

  describe "destination-driven" do
    it "adds the U.S. import processing fee for US only" do
      expect(codes(destinationCountry: "US")).to include("USI")
      expect(codes(destinationCountry: "JP")).not_to include("USI")
    end

    it "does not apply FSC to the import processing fee" do
      r = result({ destinationCountry: "US" }, 10, 30)
      expect(r[:details].find { |d| d[:code] == "USI" }[:fscAmount]).to eq(0)
    end
  end

  describe "둘 중 큰 금액" do
    it "uses the flat amount at low weight and the per-kg amount at high weight" do
      expect(result({ fedexAddOns: [ "DGA" ] }, 10)[:total]).to eq(152_100)
      expect(result({ fedexAddOns: [ "DGA" ] }, 100)[:total]).to eq(236_000)
      expect(result({ fedexAddOns: [ "DGI" ] }, 10)[:total]).to eq(93_800)
      expect(result({ fedexAddOns: [ "DGI" ] }, 100)[:total]).to eq(132_000)
    end
  end

  describe "dry ice" do
    it "charges on its own but is waived alongside dangerous goods" do
      expect(result(fedexAddOns: [ "DIC" ])[:total]).to eq(6_600)
      expect(result(fedexAddOns: [ "DIC", "DGA" ])[:details].map { |d| d[:code] }).to eq([ "DGA" ])
    end
  end

  describe "운송 신고 금액" do
    it "is free at or below 115,000원" do
      expect(described_class.fedex_declared_value_fee(115_000)).to eq(0)
    end

    it "charges 1,420원 per 115,000원 step, rounded up" do
      expect(described_class.fedex_declared_value_fee(115_001)).to eq(2_840)
      expect(described_class.fedex_declared_value_fee(460_000)).to eq(5_680)
    end
  end

  describe "user-selected flat fees" do
    {
      "SPU" => 20_100, "SDL" => 20_100, "RES" => 4_400, "ADR" => 14_600,
      "TPC" => 14_200, "SIG" => 4_000, "SDS" => 4_600, "SAS" => 5_800
    }.each do |code, expected|
      it "#{code} charges #{expected}원" do
        expect(result(fedexAddOns: [ code ])[:total]).to eq(expected)
      end
    end

    it "ignores an unknown code rather than raising" do
      expect(result(fedexAddOns: [ "NOPE" ])[:total]).to eq(0)
    end
  end

  describe "FSC" do
    it "applies FSC to surcharges that carry it" do
      r = result({ fedexAddOns: [ "SPU" ] }, 10, 30)
      expect(r[:details].first[:fscAmount]).to be_within(0.0001).of(20_100 * 0.3)
      expect(r[:total]).to be_within(0.0001).of(20_100 * 1.3)
    end
  end
end
