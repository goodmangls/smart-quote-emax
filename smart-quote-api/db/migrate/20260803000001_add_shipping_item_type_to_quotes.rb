# frozen_string_literal: true

class AddShippingItemTypeToQuotes < ActiveRecord::Migration[8.0]
  def change
    add_column :quotes, :shipping_item_type, :string, limit: 20, null: false, default: "NON_DOCUMENT"
  end
end
