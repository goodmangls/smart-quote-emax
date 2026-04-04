class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name, limit: 100
      t.string :company, limit: 200
      t.string :nationality, limit: 100
      t.string :role, null: false, default: "user", limit: 20

      t.timestamps
    end
    add_index :users, :email, unique: true
  end
end
