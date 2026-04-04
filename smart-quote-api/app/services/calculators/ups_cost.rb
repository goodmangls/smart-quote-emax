module Calculators
  class UpsCost
    # Using Lib::Constants because the file is in app/lib/constants expecting module Lib::Constants or we need to fix loading.
    # For now assuming we will fix namespaces. Using Constants::... assuming they are loaded.
    
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
        transit_time: 'UPS 2-4 Business Days'
      }
    end

    private

    def calculate_base_rate(zone_key)
      lookup_weight = round_to_half(@billable_weight)
      zone_rates = Constants::UpsTariff::UPS_EXACT_RATES[zone_key]

      if zone_rates && zone_rates[lookup_weight]
        return zone_rates[lookup_weight]
      end

      # Range Rates
      range = Constants::UpsTariff::UPS_RANGE_RATES.find { |r| @billable_weight >= r[:min] && @billable_weight <= r[:max] }

      if range && range[:rates][zone_key]
        per_kg_rate = range[:rates][zone_key]
        multiplier_weight = @billable_weight.ceil
        return multiplier_weight * per_kg_rate
      end

      # Fallback logic mirroring TS
      if zone_rates
        # Find closest weight >= lookup_weight in keys
        found_weight = zone_rates.keys.sort.find { |w| w >= lookup_weight }
        return zone_rates[found_weight] if found_weight
        
         # Check next range
         next_range = Constants::UpsTariff::UPS_RANGE_RATES.find { |r| r[:min] <= @billable_weight.ceil }
         if next_range && next_range[:rates][zone_key]
           return @billable_weight.ceil * next_range[:rates][zone_key]
         end
      end

      0
    end

    def round_to_half(num)
      (num * 2).ceil / 2.0
    end
  end
end
