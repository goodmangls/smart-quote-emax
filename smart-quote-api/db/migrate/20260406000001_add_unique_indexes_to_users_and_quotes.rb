class AddUniqueIndexesToUsersAndQuotes < ActiveRecord::Migration[8.0]
  def change
    # B-H6: users.email unique index (race condition on concurrent registration)
    remove_index :users, :email
    add_index :users, "LOWER(email)", unique: true, name: "index_users_on_lower_email"

    # B-H5: quotes.reference_no unique index (race condition on concurrent inserts)
    remove_index :quotes, :reference_no
    add_index :quotes, :reference_no, unique: true

    # M6: quotes performance indexes for QuoteSearcher
    # Ensure validity_date exists (might be missing due to out-of-sync migrations)
    unless column_exists?(:quotes, :validity_date)
      add_column :quotes, :validity_date, :date
    end

    add_index :quotes, [ :status, :validity_date ], name: "index_quotes_on_status_and_validity_date"
    add_index :quotes, :destination_country
    add_index :quotes, [ :user_id, :created_at ], name: "index_quotes_on_user_id_and_created_at"
  end
end
