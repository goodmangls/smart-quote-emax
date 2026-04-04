class AddDestinationCountryIndex < ActiveRecord::Migration[8.0]
  def change
    add_index :quotes, :destination_country unless index_exists?(:quotes, :destination_country)
    add_index :quotes, [ :user_id, :status, :created_at ], name: "idx_quotes_user_status_date" unless index_exists?(:quotes, [ :user_id, :status, :created_at ])
  end
end
