module Calculators
  class UpsCost
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
      zone_info = Calculators::UpsZone.call(@country)
      zone_key = zone_info[:rate_key]

      ups_base = calculate_base_rate(zone_key)

      fsc_rate = (@fsc_percent || 0).to_f / 100
      ups_fsc = ups_base * fsc_rate
      ups_war_risk = ups_base * Constants::Rates::WAR_RISK_SURCHARGE_RATE

      {
        intl_base: ups_base,
        intl_fsc: ups_fsc,
        intl_war_risk: ups_war_risk,
        applied_zone: zone_info[:label],
        transit_time: "UPS 2-4 Business Days"
      }
    end

    private

    def exact_rates = Constants::UpsTariff::UPS_EXACT_RATES
    def range_rates = Constants::UpsTariff::UPS_RANGE_RATES
  end
end
