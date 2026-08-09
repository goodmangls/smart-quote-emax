require "rails_helper"

RSpec.describe DiscountRule, type: :model do
  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_length_of(:name).is_at_most(100) }
    it { should validate_presence_of(:rule_type) }
    it { should validate_inclusion_of(:rule_type).in_array(%w[flat weight_based]) }
    it { should validate_presence_of(:priority) }
    # 모델은 numericality: { only_integer: true, in: 0..200 } 을 쓴다.
    # shoulda 의 is_greater_than_or_equal_to / is_less_than_or_equal_to 매처는
    # 그 옵션들이 만드는 개별 메시지("must be greater than or equal to 0")를
    # 기대하는데, in: 옵션은 "must be in 0..200" 하나만 낸다. 동작은 같으므로
    # 사용자에게 노출되는 메시지를 바꾸는 대신 경계값 동작을 직접 검증한다.
    it "priority 는 0..200 범위의 정수만 허용한다" do
      expect(build(:discount_rule, priority: 0)).to be_valid
      expect(build(:discount_rule, priority: 200)).to be_valid
      expect(build(:discount_rule, priority: -1)).not_to be_valid
      expect(build(:discount_rule, priority: 201)).not_to be_valid
      expect(build(:discount_rule, priority: 1.5)).not_to be_valid
    end
    it { should validate_presence_of(:discount_percent) }
    it { should validate_numericality_of(:discount_percent).is_greater_than_or_equal_to(5).is_less_than_or_equal_to(50) }
    it { should validate_numericality_of(:weight_min).is_greater_than_or_equal_to(0).allow_nil }
    it { should validate_numericality_of(:weight_max).is_greater_than(0).allow_nil }

    describe "weight_range_consistency" do
      it "is valid when weight_max > weight_min" do
        rule = build(:discount_rule, weight_min: 0, weight_max: 20)
        expect(rule).to be_valid
      end

      it "is invalid when weight_max <= weight_min" do
        rule = build(:discount_rule, weight_min: 20, weight_max: 10)
        expect(rule).not_to be_valid
        expect(rule.errors[:weight_max]).to include("must be greater than weight_min")
      end

      it "is invalid when weight_max equals weight_min" do
        rule = build(:discount_rule, weight_min: 20, weight_max: 20)
        expect(rule).not_to be_valid
      end

      it "allows nil weight_min and weight_max" do
        rule = build(:discount_rule, weight_min: nil, weight_max: nil)
        expect(rule).to be_valid
      end
    end

    describe "discount_percent range" do
      it "rejects discount below 5%" do
        rule = build(:discount_rule, discount_percent: 4)
        expect(rule).not_to be_valid
      end

      it "rejects discount above 50%" do
        rule = build(:discount_rule, discount_percent: 51)
        expect(rule).not_to be_valid
      end

      it "accepts discount at boundaries" do
        expect(build(:discount_rule, discount_percent: 5)).to be_valid
        expect(build(:discount_rule, discount_percent: 50)).to be_valid
      end
    end
  end

  describe "scopes" do
    let!(:active_rule) { create(:discount_rule, is_active: true, priority: 100) }
    let!(:inactive_rule) { create(:discount_rule, :inactive, priority: 50) }
    let!(:low_priority) { create(:discount_rule, is_active: true, priority: 0) }

    describe ".active" do
      it "returns only active rules" do
        expect(DiscountRule.active).to include(active_rule, low_priority)
        expect(DiscountRule.active).not_to include(inactive_rule)
      end
    end

    describe ".by_priority" do
      it "returns rules ordered by priority desc" do
        rules = DiscountRule.by_priority
        expect(rules.first.priority).to be >= rules.last.priority
      end
    end
  end
end
