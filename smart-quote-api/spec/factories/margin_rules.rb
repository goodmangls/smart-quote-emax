FactoryBot.define do
  factory :discount_rule do
    sequence(:name) { |n| "Rule #{n}" }
    rule_type { "weight_based" }
    priority { 50 }
    discount_percent { 19 }
    is_active { true }
    created_by { "system" }

    trait :flat do
      rule_type { "flat" }
    end

    trait :per_user do
      priority { 100 }
      rule_type { "flat" }
      match_email { "vip@example.com" }
    end

    trait :nationality do
      priority { 50 }
      match_nationality { "KR" }
    end

    trait :default_rule do
      priority { 0 }
    end

    trait :inactive do
      is_active { false }
    end
  end
end
