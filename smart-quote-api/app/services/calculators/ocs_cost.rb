module Calculators
  class OcsCost
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
      zone_info = Calculators::OcsZone.call(@country)
      zone_key = zone_info[:rate_key]

      ocs_base = calculate_base_rate(zone_key) + Constants::OcsTariff::OCS_HANDLING_CHARGE

      {
        intl_base: ocs_base,
        intl_fsc: 0, # FSC calculated in orchestrator (percentage on discounted base)
        intl_war_risk: 0,
        applied_zone: zone_info[:label],
        transit_time: "OCS 3-5 Business Days"
      }
    end

    private

    def exact_rates = Constants::OcsTariff::OCS_EXACT_RATES
    def range_rates = Constants::OcsTariff::OCS_RANGE_RATES
  end
end
