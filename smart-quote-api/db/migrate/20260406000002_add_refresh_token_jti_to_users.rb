class AddRefreshTokenJtiToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :refresh_token_jti, :string
  end
end
