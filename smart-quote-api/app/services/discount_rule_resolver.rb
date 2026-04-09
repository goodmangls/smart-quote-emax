class DiscountRuleResolver
  CACHE_KEY = "discount_rules_active"
  CACHE_TTL = 5.minutes
  DEFAULT_DISCOUNT = 0.0 # 정가 기준, 할인 없음

  def self.resolve(email:, nationality:, weight:)
    new.resolve(email: email, nationality: nationality, weight: weight)
  end

  def resolve(email:, nationality:, weight:)
    rules = cached_rules

    matched = rules.find do |rule|
      matches?(rule, email: email, nationality: nationality, weight: weight)
    end

    if matched
      { discount_percent: matched.discount_percent.to_f, matched_rule: matched, fallback: false }
    else
      { discount_percent: DEFAULT_DISCOUNT, matched_rule: nil, fallback: true }
    end
  end

  private

  def cached_rules
    Rails.cache.fetch(CACHE_KEY, expires_in: CACHE_TTL) do
      DiscountRule.active.by_priority.to_a
    end
  end

  # Legacy DB records may store "South Korea" while frontend sends "KR"
  NATIONALITY_ALIASES = {
    "South Korea" => "KR", "KR" => "KR",
    "United States" => "US", "US" => "US",
    "China" => "CN", "CN" => "CN",
    "Japan" => "JP", "JP" => "JP",
    "Vietnam" => "VN", "VN" => "VN",
    "Taiwan" => "TW", "TW" => "TW",
    "Singapore" => "SG", "SG" => "SG",
  }.freeze

  def nationality_matches?(rule_value, input_value)
    return true if rule_value == input_value
    NATIONALITY_ALIASES[rule_value] == NATIONALITY_ALIASES[input_value]
  end

  def matches?(rule, email:, nationality:, weight:)
    return false if rule.match_email.present? && rule.match_email != email
    return false if rule.match_nationality.present? && !nationality_matches?(rule.match_nationality, nationality)
    return false if rule.weight_min.present? && weight < rule.weight_min
    return false if rule.weight_max.present? && weight > rule.weight_max
    true
  end
end
