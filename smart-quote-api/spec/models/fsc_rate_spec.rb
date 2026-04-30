require "rails_helper"

RSpec.describe FscRate, type: :model do
  describe "validations" do
    subject { FscRate.new(carrier: "UPS", international: 45.5, domestic: 45.5) }

    it { should validate_presence_of(:carrier) }
    it { should validate_uniqueness_of(:carrier) }
    it { should validate_inclusion_of(:carrier).in_array(%w[UPS DHL FEDEX OCS]) }
    it { should validate_numericality_of(:international).is_greater_than_or_equal_to(0).is_less_than_or_equal_to(100) }
    it { should validate_numericality_of(:domestic).is_greater_than_or_equal_to(0).is_less_than_or_equal_to(100) }

    it "accepts FEDEX carrier" do
      rate = FscRate.new(carrier: "FEDEX", international: 43.5, domestic: 43.5)
      expect(rate).to be_valid
    end

    it "accepts OCS carrier" do
      rate = FscRate.new(carrier: "OCS", international: 10.0, domestic: 10.0)
      expect(rate).to be_valid
    end

    it "rejects unsupported carrier" do
      rate = FscRate.new(carrier: "INVALID", international: 10.0, domestic: 10.0)
      expect(rate).not_to be_valid
      expect(rate.errors[:carrier]).to be_present
    end
  end

  describe ".ensure_defaults!" do
    it "seeds all four supported carriers when DB is empty" do
      FscRate.ensure_defaults!
      expect(FscRate.pluck(:carrier)).to match_array(%w[UPS DHL FEDEX OCS])
    end

    it "is idempotent — running twice does not create duplicates" do
      FscRate.ensure_defaults!
      expect { FscRate.ensure_defaults! }.not_to change(FscRate, :count)
    end

    it "fills in only missing carriers, preserving existing rows" do
      existing = FscRate.create!(carrier: "UPS", international: 99.9, domestic: 99.9, source: "manual")
      FscRate.ensure_defaults!

      expect(FscRate.find_by(carrier: "UPS").international.to_f).to eq(99.9)
      expect(FscRate.pluck(:carrier)).to match_array(%w[UPS DHL FEDEX OCS])
    end

    it "uses Constants::Rates::DEFAULT_FSC_PERCENT* as seed values" do
      FscRate.ensure_defaults!
      expect(FscRate.find_by(carrier: "UPS").international.to_f).to eq(Constants::Rates::DEFAULT_FSC_PERCENT)
      expect(FscRate.find_by(carrier: "DHL").international.to_f).to eq(Constants::Rates::DEFAULT_FSC_PERCENT_DHL)
      expect(FscRate.find_by(carrier: "FEDEX").international.to_f).to eq(Constants::Rates::DEFAULT_FSC_PERCENT_FEDEX)
      expect(FscRate.find_by(carrier: "OCS").international.to_f).to eq(Constants::Rates::DEFAULT_FSC_PERCENT_OCS)
    end
  end

  describe ".rates_hash" do
    it "returns a hash keyed by carrier with international/domestic floats for all four carriers" do
      hash = FscRate.rates_hash
      expect(hash.keys).to match_array(%w[UPS DHL FEDEX OCS])
      hash.each_value do |entry|
        expect(entry).to include("international", "domestic")
        expect(entry["international"]).to be_a(Float)
        expect(entry["domestic"]).to be_a(Float)
      end
    end
  end
end
