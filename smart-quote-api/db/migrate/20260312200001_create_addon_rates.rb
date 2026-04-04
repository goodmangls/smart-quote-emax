class CreateAddonRates < ActiveRecord::Migration[8.0]
  def change
    create_table :addon_rates do |t|
      t.string  :code,           null: false, limit: 20
      t.string  :carrier,        null: false, limit: 10   # 'DHL' or 'UPS'
      t.string  :name_en,        null: false, limit: 100
      t.string  :name_ko,        null: false, limit: 100
      t.text    :description

      # Charge calculation
      t.string  :charge_type,    null: false, limit: 20   # 'fixed', 'per_piece', 'per_carton', 'calculated'
      t.string  :unit,           null: false, limit: 20   # 'shipment', 'piece', 'carton'
      t.decimal :amount,         null: false, default: 0, precision: 12, scale: 2

      # Calculation parameters for 'calculated' types
      t.decimal :per_kg_rate,    precision: 10, scale: 2   # e.g., 750 for DHL RMT, 570 for UPS RMT
      t.decimal :rate_percent,   precision: 8, scale: 4    # e.g., 1.0 for insurance (1%)
      t.decimal :min_amount,     precision: 12, scale: 2   # minimum charge (same as amount for most)

      # Behavior flags
      t.boolean :fsc_applicable, null: false, default: false
      t.boolean :auto_detect,    null: false, default: false
      t.boolean :selectable,     null: false, default: true
      t.string  :condition,      limit: 20    # e.g., 'DDP' for auto-trigger condition

      # Auto-detect thresholds (stored as JSON for flexibility)
      t.jsonb   :detect_rules    # e.g., { "max_length": 100, "max_second": 80 } for OSP

      # Validity & tracking
      t.date    :effective_from, null: false, default: -> { "CURRENT_DATE" }
      t.date    :effective_to
      t.boolean :is_active,      null: false, default: true
      t.string  :source_url
      t.string  :created_by
      t.integer :sort_order,     null: false, default: 0

      t.timestamps
    end

    add_index :addon_rates, [:carrier, :code], unique: true
    add_index :addon_rates, [:carrier, :is_active], name: "idx_addon_rates_carrier_active"
    add_index :addon_rates, :sort_order
  end
end
