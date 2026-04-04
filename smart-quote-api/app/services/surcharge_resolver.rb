class SurchargeResolver
  CACHE_KEY = "surcharge_resolver_active"
  CACHE_TTL = 5.minutes

  class << self
    # Resolve all applicable surcharges for a given carrier/country/zone
    # Returns array of { code, name, name_ko, charge_type, amount, source_url }
    def resolve(carrier:, country: nil, zone: nil)
      active_surcharges = cached_active_surcharges

      active_surcharges.select { |s|
        matches_carrier?(s, carrier) &&
          matches_country?(s, country) &&
          matches_zone?(s, zone)
      }.map { |s|
        {
          id: s.id,
          code: s.code,
          name: s.name,
          name_ko: s.name_ko,
          charge_type: s.charge_type,
          amount: s.amount.to_f,
          carrier: s.carrier,
          source_url: s.source_url,
          effective_from: s.effective_from.iso8601,
          effective_to: s.effective_to&.iso8601
        }
      }
    end

    # Calculate total surcharge amount given base rate
    def calculate_total(carrier:, country: nil, zone: nil, intl_base: 0)
      surcharges = resolve(carrier: carrier, country: country, zone: zone)

      total = 0
      applied = []

      surcharges.each do |s|
        applied_amount = if s[:charge_type] == "rate"
                           (intl_base * s[:amount] / 100.0).round(0)
                         else
                           s[:amount].round(0)
                         end

        total += applied_amount
        applied << s.merge(applied_amount: applied_amount)
      end

      { total: total, applied: applied }
    end

    def invalidate_cache!
      Rails.cache.delete(CACHE_KEY)
    end

    private

    def cached_active_surcharges
      Rails.cache.fetch(CACHE_KEY, expires_in: CACHE_TTL) do
        Surcharge.active.currently_effective.by_code.to_a
      end
    end

    def matches_carrier?(surcharge, carrier)
      surcharge.carrier.nil? || surcharge.carrier == carrier
    end

    def matches_country?(surcharge, country)
      return true if country.nil?
      surcharge.matches_country?(country)
    end

    def matches_zone?(surcharge, zone)
      return true if zone.nil?
      surcharge.matches_zone?(zone)
    end
  end
end
