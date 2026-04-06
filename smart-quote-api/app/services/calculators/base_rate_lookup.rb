module Calculators
  module BaseRateLookup
    private

    def calculate_base_rate(zone_key)
      lookup_weight = round_to_half(@billable_weight)
      zone_rates = exact_rates[zone_key]

      if zone_rates && zone_rates[lookup_weight]
        return zone_rates[lookup_weight]
      end

      range = range_rates.find { |r| @billable_weight >= r[:min] && @billable_weight <= r[:max] }

      if range && range[:rates][zone_key]
        per_kg_rate = range[:rates][zone_key]
        return @billable_weight.ceil * per_kg_rate
      end

      if zone_rates
        found_weight = zone_rates.keys.sort.find { |w| w >= lookup_weight }
        return zone_rates[found_weight] if found_weight

        next_range = range_rates.find { |r| r[:min] <= @billable_weight.ceil }
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
