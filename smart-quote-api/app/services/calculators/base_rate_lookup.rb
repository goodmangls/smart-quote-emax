module Calculators
  module BaseRateLookup
    private

    def calculate_base_rate(zone_key)
      lookup_weight = round_to_half(@billable_weight)
      zone_rates = exact_rates[zone_key]

      # Fail loudly on misconfigured zone: returning 0 silently would produce wrong quotes
      unless zone_rates
        raise ArgumentError, "Unknown zone key '#{zone_key}' for #{self.class.name}. " \
          "Valid keys: #{exact_rates.keys.join(', ')}"
      end

      if zone_rates[lookup_weight]
        return zone_rates[lookup_weight]
      end

      range = range_rates.find { |r| @billable_weight >= r[:min] && @billable_weight <= r[:max] }

      if range && range[:rates][zone_key]
        per_kg_rate = range[:rates][zone_key]
        # Base = highest exact weight rate; charge per-kg only for weight above that
        max_exact_weight = zone_rates.keys.max
        max_exact_rate   = zone_rates[max_exact_weight]
        overage_kg = @billable_weight.ceil - max_exact_weight.to_r
        return (max_exact_rate + overage_kg * per_kg_rate).to_i
      end

      # Fallback: nearest higher exact weight within zone
      found_weight = zone_rates.keys.sort.find { |w| w >= lookup_weight }
      return zone_rates[found_weight] if found_weight

      next_range = range_rates.find { |r| r[:min] <= @billable_weight.ceil }
      if next_range && next_range[:rates][zone_key]
        return @billable_weight.ceil * next_range[:rates][zone_key]
      end

      raise ArgumentError, "No rate found for zone '#{zone_key}', weight #{@billable_weight}kg in #{self.class.name}"
    end

    def round_to_half(num)
      (num * 2).ceil / 2.0
    end
  end
end
