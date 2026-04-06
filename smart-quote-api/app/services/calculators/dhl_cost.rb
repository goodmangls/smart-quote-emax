module Calculators
  class DhlCost
    include BaseRateLookup

    def self.call(billable_weight:, country:, fsc_percent:)
      new(billable_weight, country, fsc_percent).call
    end

    def initialize(billable_weight, country, fsc_percent)
      @billable_weight = billable_weight
      @country = country
      @fsc_percent = fsc_percent
    end

    def call
      zone_info = Calculators::DhlZone.call(@country)
      zone_key = zone_info[:rate_key]

      dhl_base = calculate_base_rate(zone_key)

      fsc_rate = (@fsc_percent || 0).to_f / 100
      dhl_fsc = dhl_base * fsc_rate
      dhl_war_risk = dhl_base * Constants::Rates::WAR_RISK_SURCHARGE_RATE

      {
        intl_base: dhl_base,
        intl_fsc: dhl_fsc,
        intl_war_risk: dhl_war_risk,
        applied_zone: zone_info[:label],
        transit_time: "DHL Express 3-7 Days"
      }
    end

    private

    def exact_rates = Constants::DhlTariff::DHL_EXACT_RATES
    def range_rates = Constants::DhlTariff::DHL_RANGE_RATES
  end
end
