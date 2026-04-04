class AddMissingIndexes < ActiveRecord::Migration[8.0]
  def change
    add_index :quotes, :user_id unless index_exists?(:quotes, :user_id)
    add_index :quotes, :customer_id unless index_exists?(:quotes, :customer_id)
    add_index :quotes, :status unless index_exists?(:quotes, :status)
    add_index :quotes, :created_at unless index_exists?(:quotes, :created_at)
  end
end
