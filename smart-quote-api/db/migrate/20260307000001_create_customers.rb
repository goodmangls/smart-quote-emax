class CreateCustomers < ActiveRecord::Migration[8.0]
  def change
    create_table :customers do |t|
      t.string :company_name, null: false
      t.string :contact_name
      t.string :email
      t.string :phone
      t.string :country, default: "KR"
      t.string :address
      t.text :notes
      t.references :user, foreign_key: true

      t.timestamps
    end

    add_index :customers, :company_name
    add_index :customers, :email

    add_reference :quotes, :customer, foreign_key: true
  end
end
