class QuoteCalculator
  include Constants::Rates
  include Constants::BusinessRules

  def self.call(input)
    new(input).call
  end

  def initialize(input)
    @input = input.deep_symbolize_keys
  end

  def call
    @carrier = @input[:overseasCarrier] || "UPS"
    @user_warnings = []

    calculate_items
    calculate_overseas
    calculate_surcharges
    calculate_totals

    build_result
  end

  private

  def calculate_items
    volumetric_divisor = @carrier == "EMAX" ? 6000 : 5000
    @item_result = Calculators::ItemCost.call(
      items: @input[:items],
      packing_type: @input[:packingType] || "NONE",
      manual_packing_cost: @input[:manualPackingCost],
      volumetric_divisor: volumetric_divisor,
      carrier: @carrier
    )

    @packing_fumigation_cost = 0
    if (@input[:packingType] || "NONE") != "NONE"
      @packing_fumigation_cost = FUMIGATION_FEE
    end
    if @input[:manualPackingCost] && @input[:manualPackingCost] >= 0
      @packing_fumigation_cost = 0
    end

    @packing_total = @item_result[:packing_material_cost] + @item_result[:packing_labor_cost] + @packing_fumigation_cost
    @billable_weight = [ @item_result[:total_actual_weight], @item_result[:total_packed_volumetric_weight] ].max
    @user_warnings = @item_result[:warnings].dup

    if @item_result[:total_packed_volumetric_weight] > @item_result[:total_actual_weight] * 1.2
      @user_warnings << "High Volumetric Weight Detected (>20% over actual). Consider Repacking."
    end

    if @carrier == "EMAX" && ![ "CN", "VN" ].include?(@input[:destinationCountry])
      @user_warnings << "EMAX only services China (CN) and Vietnam (VN). Using VN fallback rate — verify with carrier."
    end
  end

  def calculate_overseas
    @overseas_result = case @carrier
    when "DHL"
                         Calculators::DhlCost.call(
                           billable_weight: @billable_weight,
                           country: @input[:destinationCountry],
                           fsc_percent: @input[:fscPercent] || DEFAULT_FSC_PERCENT_DHL
                         )
    when "EMAX"
                         Calculators::EmaxCost.call(
                           billable_weight: @billable_weight,
                           country: @input[:destinationCountry]
                         )
    when "FDX", "FEDEX"
                         Calculators::FedexCost.call(
                           billable_weight: @billable_weight,
                           country: @input[:destinationCountry],
                           fsc_percent: @input[:fscPercent] || DEFAULT_FSC_PERCENT_FEDEX
                         )
    else
                         Calculators::UpsCost.call(
                           billable_weight: @billable_weight,
                           country: @input[:destinationCountry],
                           fsc_percent: @input[:fscPercent] || DEFAULT_FSC_PERCENT
                         )
    end
  end

  def calculate_surcharges
    surcharge_result = SurchargeResolver.calculate_total(
      carrier: @carrier,
      country: @input[:destinationCountry],
      zone: @overseas_result[:applied_zone],
      intl_base: @overseas_result[:intl_base]
    )
    @system_surcharge_total = surcharge_result[:total]
    @applied_surcharges = surcharge_result[:applied]

    # UPS Surge Fee (급증수수료) — auto-detect for Middle East / Israel
    @ups_surge_total = 0
    if @carrier == "UPS"
      ups_surge_fee_result = Calculators::UpsSurgeFee.call(
        country: @input[:destinationCountry],
        billable_weight: @billable_weight,
        fsc_percent: @input[:fscPercent] || DEFAULT_FSC_PERCENT
      )
      @ups_surge_total = ups_surge_fee_result[:total]
    end

    @manual_surge_cost = @input[:manualSurgeCost] || 0
    @surge_cost = @system_surcharge_total + @manual_surge_cost + @ups_surge_total

    @dest_duty = @input[:incoterm] == "DDP" ? (@input[:dutyTaxEstimate] || 0) : 0
    @pickup_in_seoul = @input[:pickupInSeoulCost] || 0
  end

  def calculate_totals
    exchange_rate = @input[:exchangeRate] || DEFAULT_EXCHANGE_RATE
    @safe_discount_percent = [ (@input[:discountPercent] || 0).to_f, 0 ].max.clamp(0, 100)
    base_rate = @overseas_result[:intl_base]

    # Apply Discount on Published Base Rate
    @base_with_discount = base_rate * (1 - @safe_discount_percent / 100.0)
    @discount_amount = base_rate - @base_with_discount

    # FSC on (Discounted Base Rate) — EMAX has no FSC
    fsc_val = @input[:fscPercent] || case @carrier
                                     when "DHL" then DEFAULT_FSC_PERCENT_DHL
                                     when "FDX", "FEDEX" then DEFAULT_FSC_PERCENT_FEDEX
                                     when "UPS" then DEFAULT_FSC_PERCENT
                                     else 0
                                     end
    fsc_rate = @carrier == "EMAX" ? 0 : (fsc_val.to_f / 100.0)
    @intl_fsc_new = (@base_with_discount * fsc_rate).round

    # Add-ons (no discount applied)
    # Note: carrierAddOnTotal (DHL 19 + UPS 6 add-ons) is frontend-only
    add_on_total = @packing_total + @pickup_in_seoul + @surge_cost + @dest_duty + @overseas_result[:intl_war_risk]

    if [ "EXW", "FOB" ].include?(@input[:incoterm])
      @user_warnings << "Collect Term: International Freight calculated for reference but may be billed to Consignee/Partner."
    end

    cost_fsc = (base_rate * fsc_rate).round
    @total_cost_amount = base_rate + cost_fsc + @overseas_result[:intl_war_risk] + @surge_cost + @packing_total + @dest_duty + @pickup_in_seoul
    raw_quote_amount = @base_with_discount + @intl_fsc_new + add_on_total
    @total_quote_amount = (raw_quote_amount / 100.0).ceil * 100
    @total_quote_amount_usd = @total_quote_amount / exchange_rate.to_f
  end

  def build_result
    {
      totalQuoteAmount: @total_quote_amount,
      totalQuoteAmountUSD: @total_quote_amount_usd,
      totalCostAmount: @total_cost_amount,
      discountAmount: @discount_amount,
      discountPercent: @safe_discount_percent.round(2),
      currency: "KRW",
      totalActualWeight: @item_result[:total_actual_weight],
      totalVolumetricWeight: @item_result[:total_packed_volumetric_weight],
      billableWeight: @billable_weight,
      appliedZone: @overseas_result[:applied_zone],
      transitTime: @overseas_result[:transit_time],
      carrier: @carrier,
      warnings: @user_warnings,
      breakdown: {
        packingMaterial: @item_result[:packing_material_cost],
        packingLabor: @item_result[:packing_labor_cost],
        packingFumigation: @packing_fumigation_cost,
        handlingFees: 0,
        intlBase: @overseas_result[:intl_base],
        intlFsc: @intl_fsc_new,
        intlWarRisk: @overseas_result[:intl_war_risk],
        intlSurge: @surge_cost,
        intlManualSurge: @manual_surge_cost,
        intlSystemSurcharge: @system_surcharge_total,
        appliedSurcharges: @applied_surcharges.map { |s|
          { code: s[:code], name: s[:name], nameKo: s[:name_ko], amount: s[:applied_amount], chargeType: s[:charge_type], sourceUrl: s[:source_url] }
        },
        pickupInSeoul: @pickup_in_seoul,
        destDuty: @dest_duty,
        totalCost: @total_cost_amount
      }
    }
  end
end
