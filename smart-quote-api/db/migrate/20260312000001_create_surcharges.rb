class CreateSurcharges < ActiveRecord::Migration[8.0]
  def change
    create_table :surcharges do |t|
      t.string  :code,           null: false, limit: 50
      t.string  :name,           null: false, limit: 100
      t.string  :name_ko,        limit: 100
      t.text    :description

      # Matching conditions (NULL = applies to all)
      t.string  :carrier,        limit: 10   # 'UPS', 'DHL', 'EMAX', or NULL
      t.string  :zone,           limit: 10   # 'Z1'-'Z10', or NULL
      t.string  :country_codes,  default: "" # Comma-separated: 'IL,JO,LB,SA' or empty

      # Charge calculation
      t.string  :charge_type,    null: false, default: "fixed" # 'fixed' or 'rate'
      t.decimal :amount,         null: false, default: 0, precision: 12, scale: 2

      # Validity
      t.date    :effective_from, null: false, default: -> { "CURRENT_DATE" }
      t.date    :effective_to                # NULL = indefinite
      t.boolean :is_active,      null: false, default: true

      # Source tracking
      t.string  :source_url      # UPS/DHL official page URL for reference
      t.string  :created_by

      t.timestamps
    end

    add_index :surcharges, :code, unique: true
    add_index :surcharges, [:is_active, :effective_from, :effective_to], name: "idx_surcharges_active_dates"
    add_index :surcharges, :carrier
  end
end
