class AddonRateResolver
  CACHE_KEY = "addon_rate_resolver"
  CACHE_TTL = 5.minutes

  class << self
    # Resolve all add-on rates for a given carrier
    # Returns array of serialized addon rates
    def resolve(carrier:)
      rates = cached_rates(carrier)
      rates.map { |r| serialize(r) }
    end

    def invalidate_cache!
      CARRIERS.each { |c| Rails.cache.delete("#{CACHE_KEY}_#{c}") }
    end

    private

    CARRIERS = %w[UPS DHL].freeze

    def cached_rates(carrier)
      Rails.cache.fetch("#{CACHE_KEY}_#{carrier}", expires_in: CACHE_TTL) do
        AddonRate.active.currently_effective.for_carrier(carrier).ordered.to_a
      end
    end

    def serialize(r)
      {
        id: r.id,
        code: r.code,
        carrier: r.carrier,
        nameEn: r.name_en,
        nameKo: r.name_ko,
        description: r.description,
        chargeType: r.charge_type,
        unit: r.unit,
        amount: r.amount.to_f,
        perKgRate: r.per_kg_rate&.to_f,
        ratePercent: r.rate_percent&.to_f,
        minAmount: r.min_amount&.to_f,
        fscApplicable: r.fsc_applicable,
        autoDetect: r.auto_detect,
        selectable: r.selectable,
        condition: r.condition,
        detectRules: r.detect_rules,
        effectiveFrom: r.effective_from.iso8601,
        effectiveTo: r.effective_to&.iso8601,
        sourceUrl: r.source_url,
        sortOrder: r.sort_order
      }
    end
  end
end
