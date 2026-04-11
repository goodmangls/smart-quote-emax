class QuoteSerializer
  # Batch version: resolves surcharges once per unique (carrier, country, zone) combination.
  # Use this for index/list responses to avoid N+1 SurchargeResolver calls.
  def self.summaries(quotes)
    # Build a lookup of current surcharges keyed by [carrier, country, zone]
    surcharge_cache = build_surcharge_cache(quotes)
    quotes.map { |q| summary(q, surcharge_cache: surcharge_cache) }
  end

  def self.summary(quote, surcharge_cache: nil)
    {
      id: quote.id,
      referenceNo: quote.reference_no,
      destinationCountry: quote.destination_country,
      totalQuoteAmount: quote.total_quote_amount.to_i,
      totalQuoteAmountUSD: quote.total_quote_amount_usd.to_f.round(2),
      discountPercent: quote.applied_discount_percent.to_f,
      billableWeight: quote.billable_weight.to_f,
      domesticTruckType: quote.domestic_truck_type,
      status: quote.status,
      customerName: quote.customer&.company_name,
      validityDate: quote.validity_date&.iso8601,
      surchargeStale: surcharge_stale?(quote, surcharge_cache: surcharge_cache),
      createdAt: quote.created_at.iso8601
    }
  end

  def self.detail(quote)
    {
      id: quote.id,
      referenceNo: quote.reference_no,
      status: quote.status,
      notes: quote.notes,
      createdAt: quote.created_at.iso8601,
      updatedAt: quote.updated_at.iso8601,
      # Input
      originCountry: quote.origin_country,
      destinationCountry: quote.destination_country,
      destinationZip: quote.destination_zip,
      domesticRegionCode: quote.domestic_region_code,
      isJejuPickup: quote.is_jeju_pickup,
      incoterm: quote.incoterm,
      packingType: quote.packing_type,
      inputDiscountPercent: quote.discount_percent.to_f,
      dutyTaxEstimate: quote.duty_tax_estimate.to_i,
      exchangeRate: quote.exchange_rate.to_f,
      fscPercent: quote.fsc_percent.to_f,
      manualDomesticCost: quote.manual_domestic_cost&.to_i,
      manualPackingCost: quote.manual_packing_cost&.to_i,
      items: quote.items,
      # Result
      totalQuoteAmount: quote.total_quote_amount.to_i,
      totalQuoteAmountUSD: quote.total_quote_amount_usd.to_f.round(2),
      totalCostAmount: quote.total_cost_amount.to_i,
      discountAmount: quote.discount_amount.to_i,
      discountPercent: quote.applied_discount_percent.to_f,
      billableWeight: quote.billable_weight.to_f,
      appliedZone: quote.applied_zone,
      domesticTruckType: quote.domestic_truck_type,
      warnings: quote.warnings,
      breakdown: quote.breakdown,
      customerId: quote.customer_id,
      customerName: quote.customer&.company_name,
      validityDate: quote.validity_date&.iso8601
    }
  end

  # Checks if surcharges stored in the quote differ from currently active ones.
  # Accepts an optional pre-fetched surcharge_cache to avoid per-quote DB calls.
  def self.surcharge_stale?(quote, surcharge_cache: nil)
    return false unless quote.status.in?(%w[draft sent])
    return false unless quote.breakdown.is_a?(Hash)

    stored = quote.breakdown["appliedSurcharges"] || []
    return false if stored.empty?

    carrier = quote.breakdown.dig("carrier") || quote.overseas_carrier
    country = quote.destination_country
    zone    = quote.applied_zone
    cache_key = [carrier, country, zone]

    current = if surcharge_cache
                surcharge_cache[cache_key] || []
              else
                SurchargeResolver.resolve(carrier: carrier, country: country, zone: zone)
              end

    stored_codes = stored.map { |s| s["code"] }.sort
    current_codes = current.map { |s| s[:code] }.sort
    return true if stored_codes != current_codes

    stored_total  = stored.sum { |s| s["appliedAmount"].to_f }
    current_total = current.sum { |s| s[:applied_amount].to_f }
    stored_total != current_total
  rescue => e
    Rails.logger.warn "[SURCHARGE_STALE] Error checking: #{e.message}"
    false
  end

  private_class_method def self.build_surcharge_cache(quotes)
    # Collect unique (carrier, country, zone) combinations from active quotes
    keys = quotes
      .select { |q| q.status.in?(%w[draft sent]) && q.breakdown.is_a?(Hash) }
      .map { |q|
        carrier = q.breakdown.dig("carrier") || q.overseas_carrier
        [ carrier, q.destination_country, q.applied_zone ]
      }
      .uniq

    # Resolve once per unique key
    keys.each_with_object({}) do |key, cache|
      carrier, country, zone = key
      cache[key] = SurchargeResolver.resolve(carrier: carrier, country: country, zone: zone)
    end
  end
end
