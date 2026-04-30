class FscRate < ApplicationRecord
  SUPPORTED_CARRIERS = %w[UPS DHL FEDEX OCS].freeze

  validates :carrier, presence: true, uniqueness: true, inclusion: { in: SUPPORTED_CARRIERS }
  validates :international, :domestic, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

  # Idempotent per-carrier seed. Inserts only missing carriers — preserves existing rows.
  # Source: Constants::Rates::DEFAULT_FSC_PERCENT* (single source of truth — see rates.rb).
  def self.ensure_defaults!
    seed_carrier!("UPS",   Constants::Rates::DEFAULT_FSC_PERCENT)
    seed_carrier!("DHL",   Constants::Rates::DEFAULT_FSC_PERCENT_DHL)
    seed_carrier!("FEDEX", Constants::Rates::DEFAULT_FSC_PERCENT_FEDEX)
    seed_carrier!("OCS",   Constants::Rates::DEFAULT_FSC_PERCENT_OCS)
  end

  def self.rates_hash
    ensure_defaults!
    all.each_with_object({}) do |r, h|
      h[r.carrier] = { "international" => r.international.to_f, "domestic" => r.domestic.to_f }
    end
  end

  def self.seed_carrier!(carrier, rate)
    return if exists?(carrier: carrier)

    create!(carrier: carrier, international: rate, domestic: rate, source: "seed")
  end
  private_class_method :seed_carrier!
end
