class AddNetworksToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :networks, :jsonb, default: []
  end
end
