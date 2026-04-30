class FscFetcher
  # Fallback rates if DB is unavailable.
  # Source: Constants::Rates::DEFAULT_FSC_PERCENT* (single source of truth — see rates.rb).
  # international = domestic per FscRateWidget convention.
  DEFAULT_RATES = {
    "UPS"   => { "international" => Constants::Rates::DEFAULT_FSC_PERCENT,       "domestic" => Constants::Rates::DEFAULT_FSC_PERCENT },
    "DHL"   => { "international" => Constants::Rates::DEFAULT_FSC_PERCENT_DHL,   "domestic" => Constants::Rates::DEFAULT_FSC_PERCENT_DHL },
    "FEDEX" => { "international" => Constants::Rates::DEFAULT_FSC_PERCENT_FEDEX, "domestic" => Constants::Rates::DEFAULT_FSC_PERCENT_FEDEX },
    "OCS"   => { "international" => Constants::Rates::DEFAULT_FSC_PERCENT_OCS,   "domestic" => Constants::Rates::DEFAULT_FSC_PERCENT_OCS }
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
