class CreateMarginRules < ActiveRecord::Migration[8.0]
  def change
    create_table :margin_rules do |t|
      t.string  :name,              null: false, limit: 100
      t.string  :rule_type,         null: false, default: "weight_based", limit: 20
      t.integer :priority,          null: false, default: 0
      t.string  :match_email,       limit: 255
      t.string  :match_nationality, limit: 100
      t.decimal :weight_min,        precision: 10, scale: 2
      t.decimal :weight_max,        precision: 10, scale: 2
      t.decimal :margin_percent,    precision: 5, scale: 2, null: false
      t.boolean :is_active,         null: false, default: true
      t.string  :created_by,        limit: 255

      t.timestamps
    end

    add_index :margin_rules, [ :is_active, :priority ], order: { priority: :desc },
              name: "idx_margin_rules_active_priority"
    add_index :margin_rules, :match_email,
              where: "match_email IS NOT NULL",
              name: "idx_margin_rules_email"
  end
end
