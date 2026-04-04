class AddShareFieldsToQuotes < ActiveRecord::Migration[8.0]
  def change
    add_column :quotes, :share_token, :string
    add_column :quotes, :share_expires_at, :datetime
    add_index :quotes, :share_token, unique: true
  end
end
