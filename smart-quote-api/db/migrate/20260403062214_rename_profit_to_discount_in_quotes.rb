class RenameProfitToDiscountInQuotes < ActiveRecord::Migration[8.0]
  def change
    rename_column :quotes, :profit_amount, :discount_amount
    rename_column :quotes, :profit_margin, :applied_discount_percent
  end
end
