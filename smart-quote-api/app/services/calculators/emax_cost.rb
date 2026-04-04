module Calculators
  class EmaxCost
    def self.call(billable_weight:, country:, fsc_percent: 0)
      new(billable_weight, country).call
    end

    def initialize(billable_weight, country)
      @billable_weight = billable_weight
      @country = country
    end

    def call
      country_key = @country == 'CN' ? 'CN' : 'VN'
      per_kg_rate = Constants::EmaxTariff::EMAX_RATES[country_key] || 10000

      multiplier_weight = @billable_weight.ceil
      emax_base = multiplier_weight * per_kg_rate
      handling_charge = Constants::EmaxTariff::EMAX_HANDLING_CHARGE

      # EMAX doesn't seem to have FSC or War Risk based on the PDF.
      # It's an all-in rate plus handling. We'll put handling in `intl_war_risk` or `intl_fsc` slot or just add it to base?
      # Let's add it to base or return it separately.
      # Better, just add it to base so the breakdown shows it cleanly.
      emax_base += handling_charge

      {
        intl_base: emax_base,
        intl_fsc: 0,
        intl_war_risk: 0,
        applied_zone: "E-MAX #{country_key}",
        transit_time: 'E-MAX Direct'
      }
    end
  end
end
