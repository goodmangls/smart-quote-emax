require "rails_helper"

RSpec.describe DiscountRuleResolver do
  before do
    Rails.cache.clear
  end

  let!(:user_flat) do
    create(:discount_rule, name: "VIP Flat", rule_type: "flat", priority: 100,
           match_email: "vip@example.com", discount_percent: 15)
  end

  let!(:user_weight_heavy) do
    create(:discount_rule, name: "User Heavy", rule_type: "weight_based", priority: 90,
           match_email: "user@example.com", weight_min: 20, discount_percent: 19)
  end

  let!(:user_weight_light) do
    create(:discount_rule, name: "User Light", rule_type: "weight_based", priority: 90,
           match_email: "user@example.com", weight_min: 0, weight_max: 19.99, discount_percent: 24)
  end

  let!(:nationality_heavy) do
    create(:discount_rule, name: "KR Heavy", rule_type: "weight_based", priority: 50,
           match_nationality: "KR", weight_min: 20, discount_percent: 19)
  end

  let!(:nationality_light) do
    create(:discount_rule, name: "KR Light", rule_type: "weight_based", priority: 50,
           match_nationality: "KR", weight_min: 0, weight_max: 19.99, discount_percent: 24)
  end

  let!(:default_heavy) do
    create(:discount_rule, name: "Default Heavy", rule_type: "weight_based", priority: 0,
           weight_min: 20, discount_percent: 24)
  end

  let!(:default_light) do
    create(:discount_rule, name: "Default Light", rule_type: "weight_based", priority: 0,
           weight_min: 0, weight_max: 19.99, discount_percent: 32)
  end

  describe ".resolve" do
    it "matches per-user flat rule (highest priority)" do
      result = described_class.resolve(email: "vip@example.com", nationality: "KR", weight: 25)
      expect(result[:discount_percent]).to eq(15.0)
      expect(result[:matched_rule].name).to eq("VIP Flat")
      expect(result[:fallback]).to be false
    end

    it "matches per-user weight-based rule for heavy weight" do
      result = described_class.resolve(email: "user@example.com", nationality: "US", weight: 25)
      expect(result[:discount_percent]).to eq(19.0)
      expect(result[:matched_rule].name).to eq("User Heavy")
    end

    it "matches per-user weight-based rule for light weight" do
      result = described_class.resolve(email: "user@example.com", nationality: "US", weight: 10)
      expect(result[:discount_percent]).to eq(24.0)
      expect(result[:matched_rule].name).to eq("User Light")
    end

    it "matches nationality rule when no user-specific rule" do
      result = described_class.resolve(email: "random@example.com", nationality: "KR", weight: 25)
      expect(result[:discount_percent]).to eq(19.0)
      expect(result[:matched_rule].name).to eq("KR Heavy")
    end

    it "matches nationality rule for light weight" do
      result = described_class.resolve(email: "random@example.com", nationality: "KR", weight: 10)
      expect(result[:discount_percent]).to eq(24.0)
      expect(result[:matched_rule].name).to eq("KR Light")
    end

    it "matches default rule for unknown user/nationality" do
      result = described_class.resolve(email: "unknown@example.com", nationality: "US", weight: 25)
      expect(result[:discount_percent]).to eq(24.0)
      expect(result[:matched_rule].name).to eq("Default Heavy")
    end

    it "matches default light rule" do
      result = described_class.resolve(email: "unknown@example.com", nationality: "US", weight: 10)
      expect(result[:discount_percent]).to eq(32.0)
      expect(result[:matched_rule].name).to eq("Default Light")
    end

    it "returns fallback when no rules match" do
      DiscountRule.update_all(is_active: false)
      Rails.cache.clear

      result = described_class.resolve(email: "test@example.com", nationality: "US", weight: 10)
      expect(result[:discount_percent]).to eq(0.0)
      expect(result[:matched_rule]).to be_nil
      expect(result[:fallback]).to be true
    end

    it "ignores inactive rules" do
      user_flat.update!(is_active: false)
      Rails.cache.clear

      result = described_class.resolve(email: "vip@example.com", nationality: "KR", weight: 25)
      expect(result[:matched_rule].name).not_to eq("VIP Flat")
    end
  end

  describe "caching" do
    it "caches rules and serves from cache" do
      described_class.resolve(email: "test@example.com", nationality: "US", weight: 10)
      expect(Rails.cache.read(DiscountRuleResolver::CACHE_KEY)).not_to be_nil
    end
  end
end
