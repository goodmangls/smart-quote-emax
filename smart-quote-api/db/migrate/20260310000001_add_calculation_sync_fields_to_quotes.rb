class AddCalculationSyncFieldsToQuotes < ActiveRecord::Migration[8.0]
  def change
    add_column :quotes, :pickup_in_seoul_cost, :decimal, precision: 12, scale: 0, default: 0, null: false
    add_column :quotes, :manual_surge_cost, :decimal, precision: 12, scale: 0, default: 0, null: false
    add_column :quotes, :overseas_carrier, :string, limit: 10, default: "UPS", null: false
    add_column :quotes, :carrier, :string, limit: 10
    add_column :quotes, :transit_time, :string, limit: 50
  end
end
