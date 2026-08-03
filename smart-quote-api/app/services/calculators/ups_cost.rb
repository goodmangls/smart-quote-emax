module Calculators
  class UpsCost
    def self.call(billable_weight:, country:, fsc_percent:, shipping_item_type: "NON_DOCUMENT")
      new(billable_weight, country, fsc_percent, shipping_item_type).call
    end

    def initialize(billable_weight, country, fsc_percent, shipping_item_type = "NON_DOCUMENT")
      @billable_weight = billable_weight
      @country = country
      @fsc_percent = fsc_percent
      @shipping_item_type = shipping_item_type
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

    def calculate_base_rate(zone_key)
      tables = Calculators::RateTableResolver.call(
        carrier: "UPS",
        shipping_item_type: @shipping_item_type,
        billable_weight: @billable_weight
      )
      lookup_weight = round_to_half(@billable_weight)
      zone_rates = tables[:exact][zone_key]

      unless zone_rates
        raise ArgumentError, "Unknown zone key '#{zone_key}' for UpsCost. " \
          "Valid keys: #{tables[:exact].keys.join(', ')}"
      end

      if zone_rates[lookup_weight]
        return zone_rates[lookup_weight]
      end

      range = tables[:range].find { |r| @billable_weight >= r[:min] && @billable_weight <= r[:max] }

      if range && range[:rates][zone_key]
        max_exact_weight = zone_rates.keys.max
        max_exact_rate = zone_rates[max_exact_weight]
        overage_kg = @billable_weight.ceil - max_exact_weight.to_r
        return (max_exact_rate + overage_kg * range[:rates][zone_key]).to_i
      end

      found_weight = zone_rates.keys.sort.find { |w| w >= lookup_weight }
      return zone_rates[found_weight] if found_weight

      next_range = tables[:range].find { |r| r[:min] <= @billable_weight.ceil }
      if next_range && next_range[:rates][zone_key]
        return @billable_weight.ceil * next_range[:rates][zone_key]
      end

      raise ArgumentError, "No rate found for zone '#{zone_key}', weight #{@billable_weight}kg in UpsCost"
    end

    def round_to_half(num)
      (num * 2).ceil / 2.0
    end
  end
end
