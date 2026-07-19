# frozen_string_literal: true

module Calculators
  # Mirrors frontend dhlAddonCalculator.ts / upsAddonCalculator.ts.
  # UPS SGF is intentionally excluded — QuoteCalculator already applies it via UpsSurgeFee.
  class CarrierAddonCost
    include Constants::BusinessRules

    DHL_FALLBACK = {
      "SAT" => { name_ko: "토요일 배송", name_en: "Saturday Delivery", amount: 60_000, charge_type: "fixed", fsc: true },
      "ELR" => { name_ko: "분쟁지역", name_en: "Elevated Risk Area", amount: 50_000, charge_type: "fixed", fsc: true },
      "OWT" => { name_ko: "과중량", name_en: "Over Weight", amount: 150_000, charge_type: "per_carton", fsc: true, detect: { weight_threshold: 70 } },
      "INS" => { name_ko: "물품 안심 발송", name_en: "Shipment Insurance", amount: 17_000, charge_type: "calculated", fsc: false, rate_percent: 1.0, min_amount: 17_000 },
      "DOC" => { name_ko: "서류 안심 발송", name_en: "Document Insurance", amount: 8_000, charge_type: "fixed", fsc: false },
      "RES" => { name_ko: "주거지역 배송", name_en: "Residential Delivery", amount: 8_000, charge_type: "fixed", fsc: true },
      "SIG" => { name_ko: "직접 서명", name_en: "Direct Signature", amount: 8_000, charge_type: "fixed", fsc: false },
      "NDS" => { name_ko: "NDS", name_en: "Non-Document Shipment", amount: 8_000, charge_type: "fixed", fsc: false },
      "RMT" => { name_ko: "외곽 요금", name_en: "Remote Area Surcharge", amount: 35_000, charge_type: "calculated", fsc: true, per_kg: 750, min_amount: 35_000 },
      "ADC" => { name_ko: "주소 정정", name_en: "Address Correction", amount: 17_000, charge_type: "fixed", fsc: false },
      "IRR" => { name_ko: "비정형 화물", name_en: "Irregular", amount: 30_000, charge_type: "per_piece", fsc: true },
      "ASR" => { name_ko: "성인 서명", name_en: "Adult Signature", amount: 8_000, charge_type: "fixed", fsc: false },
      "OSP" => { name_ko: "대형 화물", name_en: "Oversize Piece", amount: 30_000, charge_type: "per_piece", fsc: true, detect: { max_longest: 100, max_second: 80 } },
      "EMG" => { name_ko: "비상 상황", name_en: "Emergency Situation", amount: 0, charge_type: "fixed", fsc: true },
      "TSD" => { name_ko: "무역 제재국", name_en: "Trade Sanctions", amount: 50_000, charge_type: "fixed", fsc: true },
      "NSC" => { name_ko: "상단 적재 불가", name_en: "Non-Stackable", amount: 440_000, charge_type: "fixed", fsc: true },
      "MWB" => { name_ko: "수기 운송장", name_en: "Manual Waybill", amount: 15_000, charge_type: "fixed", fsc: false }
    }.freeze

    UPS_FALLBACK = {
      "RES" => { name_ko: "주거지역 서비스", name_en: "Residential Delivery", amount: 4_600, charge_type: "fixed", fsc: true },
      "RMT" => { name_ko: "외곽요금", name_en: "Remote Area Surcharge", amount: 31_400, charge_type: "calculated", fsc: true, per_kg: 570, min_amount: 31_400 },
      "EXT" => { name_ko: "원거리지역", name_en: "Extended Area", amount: 34_200, charge_type: "calculated", fsc: true, per_kg: 640, min_amount: 34_200 },
      "AHS" => { name_ko: "비규격품부가요금", name_en: "Additional Handling", amount: 21_400, charge_type: "per_carton", fsc: true, detect: { weight_threshold: 25, max_longest: 122, max_second: 76, packing_types: %w[WOODEN_BOX SKID] } },
      "ADC" => { name_ko: "주소정정", name_en: "Address Correction", amount: 15_100, charge_type: "per_carton", fsc: false },
      "DDP" => { name_ko: "DDP 수수료", name_en: "DDP Service Fee", amount: 28_500, charge_type: "fixed", fsc: false }
    }.freeze

    def self.call(carrier:, items:, packing_type:, billable_weight:, fsc_percent:,
                  dhl_add_ons: [], ups_add_ons: [], dhl_declared_value: 0,
                  incoterm: nil, resolved_addon_rates: [])
      new(
        carrier: carrier,
        items: items || [],
        packing_type: packing_type || "NONE",
        billable_weight: billable_weight.to_f,
        fsc_percent: fsc_percent.to_f,
        dhl_add_ons: Array(dhl_add_ons),
        ups_add_ons: Array(ups_add_ons),
        dhl_declared_value: dhl_declared_value.to_f,
        incoterm: incoterm,
        resolved_addon_rates: Array(resolved_addon_rates)
      ).call
    end

    def initialize(carrier:, items:, packing_type:, billable_weight:, fsc_percent:,
                   dhl_add_ons:, ups_add_ons:, dhl_declared_value:, incoterm:, resolved_addon_rates:)
      @carrier = carrier.to_s.upcase
      @items = items
      @packing_type = packing_type
      @billable_weight = billable_weight
      @fsc_rate = fsc_percent / 100.0
      @dhl_add_ons = dhl_add_ons.map(&:to_s)
      @ups_add_ons = ups_add_ons.map(&:to_s)
      @dhl_declared_value = dhl_declared_value
      @incoterm = incoterm.to_s
      @resolved = resolved_addon_rates.map { |r| normalize_rate(r) }
    end

    def call
      case @carrier
      when "DHL" then calculate_dhl
      when "UPS" then calculate_ups
      else { total: 0, details: [] }
      end
    end

    private

    def calculate_dhl
      details = []
      total = 0
      rates = rates_for("DHL", DHL_FALLBACK)

      osp_count = 0
      owt_count = 0
      osp = rates["OSP"]
      owt = rates["OWT"]

      @items.each do |item|
        packed = apply_packing(item)
        qty = item[:quantity].to_i
        dims = [ packed[:l], packed[:w], packed[:h] ].sort.reverse

        if osp
          max_l = osp[:detect]&.dig(:max_longest) || osp[:detect]&.dig("max_longest") || 100
          max_s = osp[:detect]&.dig(:max_second) || osp[:detect]&.dig("max_second") || 80
          osp_count += qty if dims[0] > max_l.to_f || dims[1] > max_s.to_f
        end

        if owt
          threshold = owt[:detect]&.dig(:weight_threshold) || owt[:detect]&.dig("weight_threshold") || 70
          owt_count += qty if packed[:weight] > threshold.to_f
        end
      end

      if osp_count > 0 && osp
        amount = osp[:amount] * osp_count
        fsc = osp[:fsc] ? amount * @fsc_rate : 0
        details << detail("OSP", osp, amount, fsc)
        total += amount + fsc
      end

      if owt_count > 0 && owt
        amount = owt[:amount] * owt_count
        fsc = owt[:fsc] ? amount * @fsc_rate : 0
        details << detail("OWT", owt, amount, fsc)
        total += amount + fsc
      end

      piece_count = @items.sum { |i| i[:quantity].to_i }
      @dhl_add_ons.each do |code|
        addon = rates[code]
        next unless addon

        amount = calc_fee(addon, @billable_weight, @dhl_declared_value)
        amount = addon[:amount] * piece_count if code == "IRR"
        fsc = addon[:fsc] ? amount * @fsc_rate : 0
        details << detail(code, addon, amount, fsc)
        total += amount + fsc
      end

      { total: total.round, details: details }
    end

    def calculate_ups
      details = []
      total = 0
      rates = rates_for("UPS", UPS_FALLBACK)

      ahs_count = 0
      ahs = rates["AHS"]
      @items.each do |item|
        packed = apply_packing(item)
        qty = item[:quantity].to_i
        dims = [ packed[:l], packed[:w], packed[:h] ].sort.reverse

        if ahs
          detect = ahs[:detect] || {}
          wt = detect[:weight_threshold] || detect["weight_threshold"] || 25
          ml = detect[:max_longest] || detect["max_longest"] || 122
          ms = detect[:max_second] || detect["max_second"] || 76
          pts = detect[:packing_types] || detect["packing_types"] || %w[WOODEN_BOX SKID]
          if packed[:weight] > wt.to_f || dims[0] > ml.to_f || dims[1] > ms.to_f || pts.include?(@packing_type)
            ahs_count += qty
          end
        end
      end

      if ahs_count > 0 && ahs
        amount = ahs[:amount] * ahs_count
        fsc = ahs[:fsc] ? amount * @fsc_rate : 0
        details << detail("AHS", ahs, amount, fsc)
        total += amount + fsc
      end

      if @incoterm == "DDP"
        ddp = rates["DDP"]
        if ddp
          details << detail("DDP", ddp, ddp[:amount], 0)
          total += ddp[:amount]
        end
      end

      # Skip SGF — handled by UpsSurgeFee in QuoteCalculator to avoid double-count.

      carton_count = @items.sum { |i| i[:quantity].to_i }
      @ups_add_ons.each do |code|
        next if code == "SGF"

        addon = rates[code]
        next unless addon

        amount = calc_fee(addon, @billable_weight, 0)
        amount = addon[:amount] * carton_count if code == "ADC"
        fsc = addon[:fsc] ? amount * @fsc_rate : 0
        details << detail(code, addon, amount, fsc)
        total += amount + fsc
      end

      { total: total.round, details: details }
    end

    def rates_for(carrier, fallback)
      db = @resolved.select { |r| r[:carrier] == carrier }
      source = db.any? ? db.index_by { |r| r[:code] } : fallback.transform_values { |v| v.merge(carrier: carrier) }
      source.transform_keys(&:to_s)
    end

    def normalize_rate(raw)
      r = raw.respond_to?(:deep_symbolize_keys) ? raw.deep_symbolize_keys : raw.to_h.symbolize_keys
      {
        code: r[:code].to_s,
        carrier: r[:carrier].to_s.upcase,
        name_ko: r[:nameKo] || r[:name_ko] || r[:code].to_s,
        name_en: r[:nameEn] || r[:name_en] || r[:code].to_s,
        amount: r[:amount].to_f,
        charge_type: (r[:chargeType] || r[:charge_type] || "fixed").to_s,
        fsc: !!(r[:fscApplicable].nil? ? r[:fsc] : r[:fscApplicable]),
        per_kg: (r[:perKgRate] || r[:per_kg_rate] || r[:per_kg])&.to_f,
        rate_percent: (r[:ratePercent] || r[:rate_percent])&.to_f,
        min_amount: (r[:minAmount] || r[:min_amount])&.to_f,
        detect: r[:detectRules] || r[:detect_rules] || r[:detect]
      }
    end

    def apply_packing(item)
      l = item[:length].to_f
      w = item[:width].to_f
      h = item[:height].to_f
      weight = item[:weight].to_f
      if @packing_type != "NONE"
        l += 10
        w += 10
        h += 15
        weight = weight * PACKING_WEIGHT_BUFFER + PACKING_WEIGHT_ADDITION
      end
      { l: l, w: w, h: h, weight: weight }
    end

    def calc_fee(rate, billable_weight, declared_value)
      if rate[:charge_type] == "calculated"
        if rate[:per_kg] && rate[:per_kg] > 0
          min = rate[:min_amount] || rate[:amount]
          return [ min, billable_weight.ceil * rate[:per_kg] ].max
        end
        if rate[:rate_percent] && rate[:rate_percent] > 0
          min = rate[:min_amount] || rate[:amount]
          return [ declared_value * rate[:rate_percent] / 100.0, min ].max
        end
      end
      rate[:amount]
    end

    def detail(code, rate, amount, fsc)
      {
        code: code,
        nameKo: rate[:name_ko] || rate[:nameKo] || code,
        nameEn: rate[:name_en] || rate[:nameEn] || code,
        amount: amount.round,
        fscAmount: fsc.round
      }
    end
  end
end
