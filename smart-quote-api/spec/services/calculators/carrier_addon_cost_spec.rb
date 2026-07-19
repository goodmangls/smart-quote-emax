# frozen_string_literal: true

require "rails_helper"

RSpec.describe Calculators::CarrierAddonCost do
  let(:items) do
    [ { length: 40, width: 30, height: 20, weight: 5, quantity: 1 } ]
  end

  describe "DHL" do
    it "adds selected RES fee with FSC" do
      result = described_class.call(
        carrier: "DHL",
        items: items,
        packing_type: "NONE",
        billable_weight: 5,
        fsc_percent: 40,
        dhl_add_ons: [ "RES" ]
      )

      expect(result[:total]).to be > 0
      expect(result[:details].map { |d| d[:code] }).to include("RES")
      res = result[:details].find { |d| d[:code] == "RES" }
      expect(res[:amount]).to eq(8_000)
      expect(res[:fscAmount]).to eq(3_200) # 8000 * 0.4
    end
  end

  describe "UPS" do
    it "adds selected RES and excludes SGF (handled by UpsSurgeFee)" do
      result = described_class.call(
        carrier: "UPS",
        items: items,
        packing_type: "NONE",
        billable_weight: 5,
        fsc_percent: 40,
        ups_add_ons: [ "RES", "SGF" ],
        incoterm: "DAP"
      )

      codes = result[:details].map { |d| d[:code] }
      expect(codes).to include("RES")
      expect(codes).not_to include("SGF")
    end

    it "auto-applies DDP fee when incoterm is DDP" do
      result = described_class.call(
        carrier: "UPS",
        items: items,
        packing_type: "NONE",
        billable_weight: 5,
        fsc_percent: 40,
        ups_add_ons: [],
        incoterm: "DDP"
      )

      expect(result[:details].map { |d| d[:code] }).to include("DDP")
    end
  end
end
