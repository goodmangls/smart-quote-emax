class CreateFscRates < ActiveRecord::Migration[8.0]
  def change
    create_table :fsc_rates do |t|
      t.string :carrier, null: false            # UPS, DHL
      t.decimal :international, null: false, precision: 5, scale: 2, default: 0
      t.decimal :domestic, null: false, precision: 5, scale: 2, default: 0
      t.string :source, default: "manual"       # manual, api
      t.string :updated_by                      # admin email
      t.timestamps
    end

    add_index :fsc_rates, :carrier, unique: true
  end
end
