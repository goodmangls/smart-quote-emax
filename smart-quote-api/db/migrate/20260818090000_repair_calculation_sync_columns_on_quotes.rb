# frozen_string_literal: true

# The production quotes table is missing all five columns from
# 20260310000001_add_calculation_sync_fields_to_quotes even though
# schema_migrations records that version as applied — the database was
# originally created from a stale schema load that marked every version
# applied without carrying these columns. Every quote save has failed with
# ActiveModel::UnknownAttributeError (manual_surge_cost) since then.
#
# Guarded with column_exists? so databases that already carry the columns
# (local dev/test, correctly-built ones) are untouched.
class RepairCalculationSyncColumnsOnQuotes < ActiveRecord::Migration[8.0]
  def up
    unless column_exists?(:quotes, :pickup_in_seoul_cost)
      add_column :quotes, :pickup_in_seoul_cost, :decimal, precision: 12, scale: 0, default: 0, null: false
    end
    unless column_exists?(:quotes, :manual_surge_cost)
      add_column :quotes, :manual_surge_cost, :decimal, precision: 12, scale: 0, default: 0, null: false
    end
    unless column_exists?(:quotes, :overseas_carrier)
      add_column :quotes, :overseas_carrier, :string, limit: 10, default: "UPS", null: false
    end
    add_column :quotes, :carrier, :string, limit: 10 unless column_exists?(:quotes, :carrier)
    add_column :quotes, :transit_time, :string, limit: 50 unless column_exists?(:quotes, :transit_time)
  end

  def down
    # Intentionally kept: removing the columns would only recreate the outage.
  end
end
