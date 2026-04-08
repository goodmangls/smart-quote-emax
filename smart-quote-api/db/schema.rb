# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_04_08_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "addon_rates", force: :cascade do |t|
    t.string "code", limit: 20, null: false
    t.string "carrier", limit: 10, null: false
    t.string "name_en", limit: 100, null: false
    t.string "name_ko", limit: 100, null: false
    t.text "description"
    t.string "charge_type", limit: 20, null: false
    t.string "unit", limit: 20, null: false
    t.decimal "amount", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "per_kg_rate", precision: 10, scale: 2
    t.decimal "rate_percent", precision: 8, scale: 4
    t.decimal "min_amount", precision: 12, scale: 2
    t.boolean "fsc_applicable", default: false, null: false
    t.boolean "auto_detect", default: false, null: false
    t.boolean "selectable", default: true, null: false
    t.string "condition", limit: 20
    t.jsonb "detect_rules"
    t.date "effective_from", default: -> { "CURRENT_DATE" }, null: false
    t.date "effective_to"
    t.boolean "is_active", default: true, null: false
    t.string "source_url"
    t.string "created_by"
    t.integer "sort_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["carrier", "code"], name: "index_addon_rates_on_carrier_and_code", unique: true
    t.index ["carrier", "is_active"], name: "idx_addon_rates_carrier_active"
    t.index ["sort_order"], name: "index_addon_rates_on_sort_order"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.bigint "user_id"
    t.string "action", null: false
    t.string "resource_type", null: false
    t.bigint "resource_id"
    t.string "resource_ref"
    t.jsonb "metadata", default: {}
    t.string "ip_address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["resource_type", "resource_id"], name: "index_audit_logs_on_resource_type_and_resource_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "customers", force: :cascade do |t|
    t.string "company_name", null: false
    t.string "contact_name"
    t.string "email"
    t.string "phone"
    t.string "country", default: "KR"
    t.string "address"
    t.text "notes"
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_name"], name: "index_customers_on_company_name"
    t.index ["email"], name: "index_customers_on_email"
    t.index ["user_id"], name: "index_customers_on_user_id"
  end

  create_table "discount_rules", force: :cascade do |t|
    t.string "name", null: false
    t.string "rule_type", default: "weight_based", null: false
    t.integer "priority", default: 50, null: false
    t.string "match_email"
    t.string "match_nationality"
    t.decimal "weight_min", precision: 10, scale: 2
    t.decimal "weight_max", precision: 10, scale: 2
    t.decimal "discount_percent", precision: 5, scale: 2, default: "15.0", null: false
    t.boolean "is_active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["match_email"], name: "index_discount_rules_on_match_email"
    t.index ["match_nationality"], name: "index_discount_rules_on_match_nationality"
    t.index ["priority"], name: "index_discount_rules_on_priority"
  end

  create_table "fsc_rates", force: :cascade do |t|
    t.string "carrier", null: false
    t.decimal "international", precision: 5, scale: 2, default: "0.0", null: false
    t.decimal "domestic", precision: 5, scale: 2, default: "0.0", null: false
    t.string "source", default: "manual"
    t.string "updated_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["carrier"], name: "index_fsc_rates_on_carrier", unique: true
  end

  create_table "quotes", force: :cascade do |t|
    t.string "reference_no"
    t.string "status"
    t.text "notes"
    t.string "origin_country"
    t.string "destination_country"
    t.string "destination_zip"
    t.string "domestic_region_code"
    t.boolean "is_jeju_pickup"
    t.string "incoterm"
    t.string "packing_type"
    t.decimal "discount_percent"
    t.decimal "duty_tax_estimate"
    t.decimal "exchange_rate"
    t.decimal "fsc_percent"
    t.decimal "manual_domestic_cost"
    t.decimal "manual_packing_cost"
    t.jsonb "items"
    t.decimal "total_quote_amount"
    t.decimal "total_quote_amount_usd"
    t.decimal "total_cost_amount"
    t.decimal "discount_amount"
    t.decimal "applied_discount_percent"
    t.decimal "billable_weight"
    t.string "applied_zone"
    t.string "domestic_truck_type"
    t.jsonb "warnings"
    t.jsonb "breakdown"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "share_token"
    t.datetime "share_expires_at"
    t.date "validity_date"
    t.index ["destination_country"], name: "index_quotes_on_destination_country"
    t.index ["reference_no"], name: "index_quotes_on_reference_no", unique: true
    t.index ["share_token"], name: "index_quotes_on_share_token", unique: true
    t.index ["status", "validity_date"], name: "index_quotes_on_status_and_validity_date"
    t.index ["user_id", "created_at"], name: "index_quotes_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_quotes_on_user_id"
  end

  create_table "surcharges", force: :cascade do |t|
    t.string "code", limit: 50, null: false
    t.string "name", limit: 100, null: false
    t.string "name_ko", limit: 100
    t.text "description"
    t.string "carrier", limit: 10
    t.string "zone", limit: 10
    t.string "country_codes", default: ""
    t.string "charge_type", default: "fixed", null: false
    t.decimal "amount", precision: 12, scale: 2, default: "0.0", null: false
    t.date "effective_from", default: -> { "CURRENT_DATE" }, null: false
    t.date "effective_to"
    t.boolean "is_active", default: true, null: false
    t.string "source_url"
    t.string "created_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["carrier"], name: "index_surcharges_on_carrier"
    t.index ["code"], name: "index_surcharges_on_code", unique: true
    t.index ["is_active", "effective_from", "effective_to"], name: "idx_surcharges_active_dates"
  end

  create_table "users", force: :cascade do |t|
    t.string "email"
    t.string "password_digest"
    t.string "name"
    t.string "company"
    t.string "nationality"
    t.string "role"
    t.jsonb "networks", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "refresh_token_jti"
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
  end

  add_foreign_key "quotes", "users"
end
