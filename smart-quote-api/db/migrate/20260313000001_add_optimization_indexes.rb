class AddOptimizationIndexes < ActiveRecord::Migration[8.0]
  def change
    add_index :quotes, :validity_date,
              where: "status IN ('draft', 'sent')",
              name: "idx_quotes_stale_drafts"

    add_index :margin_rules, :match_nationality,
              where: "match_nationality IS NOT NULL",
              name: "idx_margin_rules_nationality"
  end
end
