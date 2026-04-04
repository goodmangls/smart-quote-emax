class RenameMarginRulesToDiscountRules < ActiveRecord::Migration[8.0]
  def change
    rename_table :margin_rules, :discount_rules
    rename_column :discount_rules, :margin_percent, :discount_percent
    rename_column :quotes, :margin_percent, :discount_percent
  end
end
