module Calculators
  class FedexCost
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
      zone_info = Calculators::FedexZone.call(@country)
      zone_key = zone_info[:rate_key]

      fedex_base = calculate_base_rate(zone_key)

      fsc_rate = (@fsc_percent || 0).to_f / 100
      fedex_fsc = fedex_base * fsc_rate
      fedex_war_risk = fedex_base * Constants::Rates::WAR_RISK_SURCHARGE_RATE

      {
        intl_base: fedex_base,
        intl_fsc: fedex_fsc,
        intl_war_risk: fedex_war_risk,
        applied_zone: zone_info[:label],
        transit_time: "FedEx Int. Priority 3-7 Days"
      }
    end

    private

    def exact_rates = Constants::FedexTariff::FEDEX_EXACT_RATES
    def range_rates = Constants::FedexTariff::FEDEX_RANGE_RATES
  end
end
