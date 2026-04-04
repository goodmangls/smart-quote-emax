class AddGoodmanglsAdminMarginRules < ActiveRecord::Migration[7.1]
  def up
    goodmangls_rules = [
      { name: "굿맨GLS 신현억 ≥20kg", rule_type: "weight_based", priority: 100,
        match_email: "ceo@goodmangls.com", weight_min: 20, weight_max: nil, margin_percent: 19 },
      { name: "굿맨GLS 신현억 <20kg", rule_type: "weight_based", priority: 100,
        match_email: "ceo@goodmangls.com", weight_min: 0, weight_max: 19.99, margin_percent: 24 },
      { name: "굿맨GLS 전경환 ≥20kg", rule_type: "weight_based", priority: 100,
        match_email: "ken.jeon@goodmangls.com", weight_min: 20, weight_max: nil, margin_percent: 19 },
      { name: "굿맨GLS 전경환 <20kg", rule_type: "weight_based", priority: 100,
        match_email: "ken.jeon@goodmangls.com", weight_min: 0, weight_max: 19.99, margin_percent: 24 },
      { name: "굿맨GLS 임재홍 ≥20kg", rule_type: "weight_based", priority: 100,
        match_email: "jaehong.lim@goodmangls.com", weight_min: 20, weight_max: nil, margin_percent: 19 },
      { name: "굿맨GLS 임재홍 <20kg", rule_type: "weight_based", priority: 100,
        match_email: "jaehong.lim@goodmangls.com", weight_min: 0, weight_max: 19.99, margin_percent: 24 },
      { name: "굿맨GLS 이창희 ≥20kg", rule_type: "weight_based", priority: 100,
        match_email: "charlie@goodmangls.com", weight_min: 20, weight_max: nil, margin_percent: 19 },
      { name: "굿맨GLS 이창희 <20kg", rule_type: "weight_based", priority: 100,
        match_email: "charlie@goodmangls.com", weight_min: 0, weight_max: 19.99, margin_percent: 24 },
    ]

    now = Time.current
    goodmangls_rules.each do |rule|
      # Skip if already exists (idempotent)
      next if MarginRule.exists?(match_email: rule[:match_email], weight_min: rule[:weight_min])

      MarginRule.create!(rule.merge(created_at: now, updated_at: now))
    end

    # Also fix any legacy 'South Korea' nationality values to 'KR'
    MarginRule.where(match_nationality: "South Korea").update_all(match_nationality: "KR")

    Rails.logger.info "[MIGRATION] Added goodmangls admin margin rules. Total: #{MarginRule.count}"
  end

  def down
    %w[ceo@goodmangls.com ken.jeon@goodmangls.com jaehong.lim@goodmangls.com charlie@goodmangls.com].each do |email|
      MarginRule.where(match_email: email).destroy_all
    end
  end
end
