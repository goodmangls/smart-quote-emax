module Calculators
  class EmaxCost
    include BaseRateLookup

    def self.call(billable_weight:, country:, fsc_percent: 0)
      new(billable_weight, country).call
    end

    def initialize(billable_weight, country)
      @billable_weight = billable_weight
      @country = country
    end

    def call
      country_key = @country == "CN" ? "CN" : "VN"
      
      emax_base = calculate_base_rate(country_key)

      {
        intl_base: emax_base,
        intl_fsc: 0,
        intl_war_risk: 0,
        applied_zone: "E-MAX #{country_key}",
        transit_time: "E-MAX Direct"
      }
    end

    private

    def exact_rates = Constants::EmaxTariff::EMAX_EXACT_RATES
    def range_rates = Constants::EmaxTariff::EMAX_RANGE_RATES
  end
end
