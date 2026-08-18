# frozen_string_literal: true

# Comprehensive reconciliation of the production quotes table against
# db/structure.sql.
#
# Background: the production DB was created from a stale schema load that
# marked migration versions applied without carrying their changes, and the
# quotes migrations were later rewritten in place (commit 1515e6d switched the
# margin model to the discount model inside the ORIGINAL create_quotes file, so
# databases built before it never received the new columns and still carry
# legacy NOT NULL columns the current code never writes). The 20260818090000
# repair covered one five-column batch; this closes the rest in one pass
# instead of peeling failures one deploy at a time:
#
#   1. Every column of the current structure.sql quotes definition is added if
#      missing (column_exists? guards — correctly-built databases are no-ops).
#   2. Any leftover legacy column NOT in the expected set that is NOT NULL
#      without a default is relaxed to nullable so INSERTs from current code
#      cannot hit a NotNullViolation.
#   3. next_quote_seq is re-created idempotently with the fixed advisory-lock
#      body from 20260809000001, covering databases where that version was
#      falsely marked applied.
class ReconcileQuotesSchemaWithStructure < ActiveRecord::Migration[8.0]
  # column => [type, options] — mirrors db/structure.sql exactly.
  EXPECTED_COLUMNS = {
    "reference_no" => [ :string, { limit: 20, null: false } ],
    "origin_country" => [ :string, { limit: 3, default: "KR", null: false } ],
    "destination_country" => [ :string, { limit: 3, null: false } ],
    "destination_zip" => [ :string, { limit: 20 } ],
    "domestic_region_code" => [ :string, { limit: 1, default: "A", null: false } ],
    "is_jeju_pickup" => [ :boolean, { default: false } ],
    "incoterm" => [ :string, { limit: 5, null: false } ],
    "packing_type" => [ :string, { limit: 20, default: "NONE", null: false } ],
    "shipping_item_type" => [ :string, { limit: 20, default: "NON_DOCUMENT", null: false } ],
    "discount_percent" => [ :decimal, { precision: 5, scale: 2, null: false, default: 0 } ],
    "duty_tax_estimate" => [ :decimal, { precision: 12, scale: 0, default: 0 } ],
    "exchange_rate" => [ :decimal, { precision: 10, scale: 2, null: false, default: 0 } ],
    "fsc_percent" => [ :decimal, { precision: 5, scale: 2, null: false, default: 0 } ],
    "manual_domestic_cost" => [ :decimal, { precision: 12, scale: 0 } ],
    "manual_packing_cost" => [ :decimal, { precision: 12, scale: 0 } ],
    "items" => [ :jsonb, { null: false, default: [] } ],
    "total_quote_amount" => [ :decimal, { precision: 15, scale: 0, null: false, default: 0 } ],
    "total_quote_amount_usd" => [ :decimal, { precision: 12, scale: 2, null: false, default: 0 } ],
    "total_cost_amount" => [ :decimal, { precision: 15, scale: 0, null: false, default: 0 } ],
    "discount_amount" => [ :decimal, { precision: 15, scale: 0, null: false, default: 0 } ],
    "applied_discount_percent" => [ :decimal, { precision: 5, scale: 2, null: false, default: 0 } ],
    "billable_weight" => [ :decimal, { precision: 10, scale: 2, null: false, default: 0 } ],
    "applied_zone" => [ :string, { limit: 50 } ],
    "domestic_truck_type" => [ :string, { limit: 50 } ],
    "breakdown" => [ :jsonb, { null: false, default: {} } ],
    "warnings" => [ :jsonb, { default: [] } ],
    "status" => [ :string, { limit: 20, default: "draft" } ],
    "notes" => [ :text, {} ],
    "user_id" => [ :bigint, {} ],
    "customer_id" => [ :bigint, {} ],
    "pickup_in_seoul_cost" => [ :decimal, { precision: 12, scale: 0, default: 0, null: false } ],
    "manual_surge_cost" => [ :decimal, { precision: 12, scale: 0, default: 0, null: false } ],
    "overseas_carrier" => [ :string, { limit: 10, default: "UPS", null: false } ],
    "carrier" => [ :string, { limit: 10 } ],
    "transit_time" => [ :string, { limit: 50 } ],
    "validity_date" => [ :date, {} ],
    "share_token" => [ :string, {} ],
    "share_expires_at" => [ :datetime, {} ]
  }.freeze

  ALWAYS_PRESENT = %w[id created_at updated_at].freeze

  def up
    EXPECTED_COLUMNS.each do |name, (type, options)|
      next if column_exists?(:quotes, name)

      add_column :quotes, name, type, **options
    end

    # Legacy columns from the pre-rewrite schema (e.g. margin_percent) that the
    # current code never assigns must not block INSERTs.
    connection.columns(:quotes).each do |column|
      next if EXPECTED_COLUMNS.key?(column.name) || ALWAYS_PRESENT.include?(column.name)
      next if column.null || column.default.present? || column.default_function.present?

      change_column_null :quotes, column.name, true
    end

    # Idempotent re-create of the numbering function (body from 20260809000001)
    # for databases where that version was falsely marked applied.
    execute <<~SQL
      CREATE OR REPLACE FUNCTION next_quote_seq(p_year INT)
      RETURNS INT
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_seq INT;
      BEGIN
        PERFORM pg_advisory_xact_lock(hashtext('quote_seq_' || p_year));

        SELECT COALESCE(MAX(
          CAST(SPLIT_PART(reference_no, '-', 3) AS INT)
        ), 0) + 1
        INTO v_seq
        FROM quotes
        WHERE reference_no LIKE 'SQ-' || p_year || '-%'
          AND reference_no ~ '^SQ-[0-9]{4}-[0-9]+$';

        RETURN v_seq;
      END;
      $$;
    SQL
  end

  def down
    # Intentionally kept: reversing would recreate the production outage.
  end
end
