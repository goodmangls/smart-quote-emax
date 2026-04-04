class CreateQuotes < ActiveRecord::Migration[8.0]
  def change
    create_table :quotes do |t|
      t.string  :reference_no, null: false, limit: 20
      t.string  :origin_country, null: false, default: "KR", limit: 3
      t.string  :destination_country, null: false, limit: 3
      t.string  :destination_zip, limit: 20
      t.string  :domestic_region_code, null: false, default: "A", limit: 1
      t.boolean :is_jeju_pickup, default: false
      t.string  :incoterm, null: false, limit: 5
      t.string  :packing_type, null: false, default: "NONE", limit: 20
      t.decimal :margin_percent, null: false, precision: 5, scale: 2
      t.decimal :duty_tax_estimate, precision: 12, scale: 0, default: 0
      t.decimal :exchange_rate, null: false, precision: 10, scale: 2
      t.decimal :fsc_percent, null: false, precision: 5, scale: 2
      t.decimal :manual_domestic_cost, precision: 12, scale: 0
      t.decimal :manual_packing_cost, precision: 12, scale: 0

      # Cargo items stored as JSONB
      t.jsonb :items, null: false

      # Result summary
      t.decimal :total_quote_amount, null: false, precision: 15, scale: 0
      t.decimal :total_quote_amount_usd, null: false, precision: 12, scale: 2
      t.decimal :total_cost_amount, null: false, precision: 15, scale: 0
      t.decimal :profit_amount, null: false, precision: 15, scale: 0
      t.decimal :profit_margin, null: false, precision: 5, scale: 2
      t.decimal :billable_weight, null: false, precision: 10, scale: 2
      t.string  :applied_zone, limit: 50
      t.string  :domestic_truck_type, limit: 50

      # Breakdown and warnings as JSONB
      t.jsonb :breakdown, null: false
      t.jsonb :warnings, default: []

      # Metadata
      t.string :status, default: "draft", limit: 20
      t.text   :notes

      t.timestamps
    end

    add_index :quotes, :reference_no, unique: true
    add_index :quotes, :destination_country
    add_index :quotes, :created_at, order: :desc
    add_index :quotes, :status
  end
end
