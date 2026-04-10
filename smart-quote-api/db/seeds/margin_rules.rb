return if DiscountRule.exists?

DiscountRule.create!([
  # Default discount rule for all users (EMAX system)
  { name: "기본 할인율", rule_type: "flat", priority: 0,
    discount_percent: 15, created_by: "system" }
])

Rails.logger.info "[SEED] Created #{DiscountRule.count} discount rules"
