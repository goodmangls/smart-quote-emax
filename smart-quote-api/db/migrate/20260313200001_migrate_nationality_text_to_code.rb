class MigrateNationalityTextToCode < ActiveRecord::Migration[8.0]
  MAPPING = {
    "South Korea" => "KR",
    "United States" => "US",
    "China" => "CN",
    "Japan" => "JP",
    "Vietnam" => "VN",
    "Taiwan" => "TW",
    "Singapore" => "SG",
    "Other" => nil,
  }.freeze

  def up
    MAPPING.each do |text, code|
      if code
        execute <<~SQL.squish
          UPDATE users SET nationality = '#{code}' WHERE nationality = '#{text}'
        SQL
      else
        execute <<~SQL.squish
          UPDATE users SET nationality = NULL WHERE nationality = '#{text}'
        SQL
      end
    end
  end

  def down
    MAPPING.each do |text, code|
      next unless code

      execute <<~SQL.squish
        UPDATE users SET nationality = '#{text}' WHERE nationality = '#{code}'
      SQL
    end
  end
end
