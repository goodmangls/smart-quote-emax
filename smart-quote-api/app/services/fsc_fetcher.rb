class FscFetcher
  # Fallback rates if DB is unavailable (verified 2026-03-15)
  DEFAULT_RATES = {
    "UPS" => { "international" => 38.5, "domestic" => 36.5 },
    "DHL" => { "international" => 30.5, "domestic" => 28.5 }
  }.freeze

  class << self
    def current_rates
      FscRate.rates_hash
    rescue StandardError => e
      Rails.logger.warn("FscFetcher: DB read failed, using defaults: #{e.message}")
      DEFAULT_RATES
    end

    def update!(carrier:, international:, domestic:, updated_by: nil)
      record = FscRate.find_or_initialize_by(carrier: carrier.upcase)
      record.update!(
        international: international,
        domestic: domestic,
        source: "manual",
        updated_by: updated_by
      )
      record
    end
  end
end
