require "rails_helper"

# Mirrors src/config/__tests__/fedex_zones.test.ts — the two tables must not drift
# apart, or the UI quote and the saved quote disagree.
RSpec.describe Calculators::FedexZone do
  describe "countries corrected against the official FedEx table (2026-08)" do
    {
      "BE" => "ZM", "NL" => "ZM",                                    # were ZG
      "CH" => "ZG", "FI" => "ZG", "IE" => "ZG", "MC" => "ZG",        # were ZM
      "NO" => "ZG", "PT" => "ZG", "SE" => "ZG",                      # were ZM
      "SK" => "ZG",                                                  # was ZH — over-quoted 14.8%
      "IL" => "ZH",                                                  # was ZG — under-quoted 17.4%
      "MP" => "ZI",                                                  # was ZD — under-quoted 74.2%
      "NZ" => "ZU"                                                   # was ZF
    }.each do |country, zone|
      it "maps #{country} to #{zone}" do
        expect(described_class.call(country)[:rate_key]).to eq(zone)
      end
    end
  end

  describe "one representative per zone" do
    {
      "MO" => "ZA", "GU" => "ZD", "US" => "ZF", "AT" => "ZG", "TR" => "ZH",
      "BR" => "ZI", "EG" => "ZJ", "CN-S" => "ZK", "GB" => "ZM", "VN" => "ZN",
      "IN" => "ZO", "JP" => "ZP", "MY" => "ZQ", "TH" => "ZR", "PH" => "ZS",
      "ID" => "ZT", "AU" => "ZU", "HK" => "ZV", "CN" => "ZW", "TW" => "ZX",
      "SG" => "ZY"
    }.each do |country, zone|
      it "maps #{country} to #{zone}" do
        expect(described_class.call(country)[:rate_key]).to eq(zone)
      end
    end
  end

  describe "coverage" do
    it "covers every country listed in the official table" do
      expect(described_class::ZONE_MAP.size).to eq(205)
    end

    it "uses only rate keys that exist in the FedEx tariff" do
      valid = %w[A D E F G H I J K M N O P Q R S T U V W X Y].map { |l| "Z#{l}" }
      expect(described_class::ZONE_MAP.values.uniq - valid).to be_empty
    end

    it "has a label for every rate key in use" do
      expect(described_class::ZONE_MAP.values.uniq - described_class::ZONE_LABELS.keys).to be_empty
    end
  end

  describe "fallback" do
    it "falls back to ZJ, the most expensive common zone" do
      expect(described_class.call("ZZ")).to eq(rate_key: "ZJ", label: "Rest of World")
    end

    it "does not mark a mapped country as fallback" do
      expect(described_class.call("SG")).to eq(rate_key: "ZY", label: "Singapore")
    end

    %w[MM SD SS SL CF KM GW TM TJ XK SM VA].each do |country|
      it "#{country} is absent from the official table and uses the fallback" do
        expect(described_class::ZONE_MAP).not_to have_key(country)
        expect(described_class.call(country)[:rate_key]).to eq("ZJ")
      end
    end
  end
end
