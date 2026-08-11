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
    calculate_carrier_addons
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

    # E-MAX policy: for multi-box shipments (2+ physical boxes) round each box's
    # chargeable weight up to 0.5kg individually, then sum (total_billable_weight).
    # A single box keeps the legacy max-of-totals behavior unchanged.
    total_box_count = (@input[:items] || []).sum { |it| it[:quantity].to_i }
    raw_billable_weight = if total_box_count >= 2
      @item_result[:total_billable_weight]
    else
      [ @item_result[:total_actual_weight], @item_result[:total_packed_volumetric_weight] ].max
    end
    @user_warnings = @item_result[:warnings].dup

    # FedEx rates a package meeting the 추가 취급 요금 – 용적 criteria at no less than
    # 18kg. The surcharge is flat, so the rule lands on the tariff lookup below.
    # nil unless a package actually triggers it — other carriers are untouched.
    fedex_min_chargeable = if @carrier == "FEDEX"
      Calculators::CarrierAddonCost.fedex_min_chargeable_weight(@input[:items], @input[:packingType] || "NONE")
    end
    @billable_weight = fedex_min_chargeable ? [ raw_billable_weight, fedex_min_chargeable ].max : raw_billable_weight

    if fedex_min_chargeable && @billable_weight > raw_billable_weight
      @user_warnings << "FedEx Minimum Chargeable Weight: rated at #{@billable_weight}kg " \
                        "(actual #{raw_billable_weight}kg) — package meets the Additional Handling – Dimension criteria."
    end

    if @item_result[:total_packed_volumetric_weight] > @item_result[:total_actual_weight] * 1.2
      @user_warnings << "High Volumetric Weight Detected (>20% over actual). Consider Repacking."
    end

    if @carrier == "EMAX" && ![ "CN", "VN" ].include?(@input[:destinationCountry])
      @user_warnings << "EMAX only services China (CN) and Vietnam (VN). Using VN fallback rate — verify with carrier."
    end

    if @carrier == "OCS" && !Constants::OcsTariff::OCS_SUPPORTED_COUNTRIES.include?(@input[:destinationCountry])
      @user_warnings << "OCS only services Taiwan (TW), Hong Kong (HK), Singapore (SG), China (CN), and Japan (JP). Using Z1 fallback rate — verify with carrier."
    end
  end

  def calculate_overseas
    shipping_item_type = @input[:shippingItemType] || "NON_DOCUMENT"
    fsc = @input[:fscPercent] || default_fsc_for(@carrier)
    @overseas_result = case @carrier
    when "DHL"
      Calculators::DhlCost.call(
        billable_weight: @billable_weight,
        country: @input[:destinationCountry],
        fsc_percent: fsc,
        shipping_item_type: shipping_item_type
      )
    when "EMAX"
      Calculators::EmaxCost.call(billable_weight: @billable_weight, country: @input[:destinationCountry])
    when "FDX", "FEDEX"
      Calculators::FedexCost.call(
        billable_weight: @billable_weight,
        country: @input[:destinationCountry],
        fsc_percent: fsc,
        shipping_item_type: shipping_item_type
      )
    when "OCS"
      Calculators::OcsCost.call(billable_weight: @billable_weight, country: @input[:destinationCountry], fsc_percent: fsc)
    else
      Calculators::UpsCost.call(
        billable_weight: @billable_weight,
        country: @input[:destinationCountry],
        fsc_percent: fsc,
        shipping_item_type: shipping_item_type
      )
    end

    if shipping_item_type == "DOCUMENT"
      if @carrier == "DHL" && @billable_weight > Constants::DhlTariff::DHL_DOC_MAX_KG
        @user_warnings << "Document rates apply up to 2.0kg on DHL; Parcel tariff used for this weight."
      elsif (@carrier == "FDX" || @carrier == "FEDEX") && @billable_weight > Constants::FedexTariff::FEDEX_DOC_MAX_KG
        @user_warnings << "Document rates apply up to 2.5kg on FedEx (Envelope/Pak); IP Parcel tariff used for this weight."
      elsif @carrier == "UPS" && @billable_weight > Constants::UpsTariff::UPS_DOC_MAX_KG
        @user_warnings << "Document rates apply up to 5.0kg on UPS; Parcel tariff used for this weight."
      end
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
      @ups_surge_total = ups_surge_fee_result ? ups_surge_fee_result[:total] : 0
    end

    @manual_surge_cost = @input[:manualSurgeCost] || 0
    @surge_cost = @system_surcharge_total + @manual_surge_cost + @ups_surge_total

    @dest_duty = @input[:incoterm] == "DDP" ? (@input[:dutyTaxEstimate] || 0) : 0
    @pickup_in_seoul = @input[:pickupInSeoulCost] || 0
  end

  def calculate_carrier_addons
    # UPS SGF is applied in calculate_surcharges via UpsSurgeFee — excluded here.
    result = Calculators::CarrierAddonCost.call(
      carrier: @carrier,
      items: @input[:items],
      packing_type: @input[:packingType] || "NONE",
      billable_weight: @billable_weight,
      fsc_percent: @input[:fscPercent] || default_fsc_for(@carrier),
      dhl_add_ons: @input[:dhlAddOns],
      ups_add_ons: @input[:upsAddOns],
      dhl_declared_value: @input[:dhlDeclaredValue] || 0,
      incoterm: @input[:incoterm],
      resolved_addon_rates: @input[:resolvedAddonRates],
      fedex_add_ons: @input[:fedexAddOns],
      fedex_declared_value: @input[:fedexDeclaredValue] || 0,
      destination_country: @input[:destinationCountry]
    )
    @carrier_addon_total = result[:total]
    @carrier_addon_details = result[:details]
  end

  def calculate_totals
    exchange_rate = @input[:exchangeRate] || DEFAULT_EXCHANGE_RATE
    @safe_discount_percent = [ (@input[:discountPercent] || 0).to_f, 0 ].max.clamp(0, MAX_DISCOUNT_PERCENT)
    base_rate = @overseas_result[:intl_base]

    # Apply Discount on Published Base Rate
    @base_with_discount = base_rate * (1 - @safe_discount_percent / 100.0)
    @discount_amount = base_rate - @base_with_discount

    fsc_rate = 0
    if @carrier == "EMAX"
      # E-MAX FSC is 15-day variable per KG. Source: Constants::EmaxTariff::EMAX_FSC_PER_KG.
      fsc_per_kg = Constants::EmaxTariff::EMAX_FSC_PER_KG[@input[:destinationCountry]] ||
                   Constants::EmaxTariff::EMAX_FSC_PER_KG["VN"]
      @intl_fsc_new = (round_to_half(@billable_weight) * fsc_per_kg).round
    else
      fsc_val  = @input[:fscPercent] || default_fsc_for(@carrier)
      fsc_rate = fsc_val.to_f / 100.0
      @intl_fsc_new = (@base_with_discount * fsc_rate).round
    end

    # Add-ons (no discount applied) — includes carrier add-ons (DHL/UPS)
    add_on_total = @packing_total + @pickup_in_seoul + @surge_cost + @carrier_addon_total +
                   @dest_duty + @overseas_result[:intl_war_risk]

    if [ "EXW", "FOB" ].include?(@input[:incoterm])
      @user_warnings << "Collect Term: International Freight calculated for reference but may be billed to Consignee/Partner."
    end

    cost_fsc = @carrier == "EMAX" ? @intl_fsc_new : (base_rate * fsc_rate).round
    @total_cost_amount = base_rate + cost_fsc + @overseas_result[:intl_war_risk] + @surge_cost +
                         @packing_total + @carrier_addon_total + @dest_duty + @pickup_in_seoul
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
        carrierAddOnTotal: @carrier_addon_total.positive? ? @carrier_addon_total : nil,
        carrierAddOnDetails: @carrier_addon_details.presence,
        totalCost: @total_cost_amount
      }
    }
  end

  # Single source of truth for carrier FSC default rates.
  # EMAX returns 0 since it has no FSC.
  def default_fsc_for(carrier)
    case carrier
    when "DHL"         then DEFAULT_FSC_PERCENT_DHL
    when "FDX", "FEDEX" then DEFAULT_FSC_PERCENT_FEDEX
    when "OCS"         then DEFAULT_FSC_PERCENT_OCS
    when "EMAX"        then 0
    else                    DEFAULT_FSC_PERCENT  # UPS and others
    end
  end

  private

  def round_to_half(num)
    (num * 2).ceil / 2.0
  end
end
