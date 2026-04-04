class FscRate < ApplicationRecord
  validates :carrier, presence: true, uniqueness: true, inclusion: { in: %w[UPS DHL] }
  validates :international, :domestic, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

  # Seed default rates if table is empty
  def self.ensure_defaults!
    return if exists?

    create!(carrier: "UPS", international: 38.5, domestic: 36.5, source: "seed")
    create!(carrier: "DHL", international: 30.5, domestic: 28.5, source: "seed")
  end

  def self.rates_hash
    ensure_defaults!
    all.each_with_object({}) do |r, h|
      h[r.carrier] = { "international" => r.international.to_f, "domestic" => r.domestic.to_f }
    end
  end
end
