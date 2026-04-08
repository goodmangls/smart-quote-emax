class EnsureNetworksColumnOnUsers < ActiveRecord::Migration[8.0]
  def change
    unless column_exists?(:users, :networks)
      add_column :users, :networks, :jsonb, default: []
    end
  end
end
