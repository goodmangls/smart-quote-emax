class AddValidityDateToQuotes < ActiveRecord::Migration[8.0]
  def change
    add_column :quotes, :validity_date, :date

    reversible do |dir|
      dir.up do
        execute "UPDATE quotes SET validity_date = created_at::date + 7 WHERE validity_date IS NULL"
      end
    end
  end
end
