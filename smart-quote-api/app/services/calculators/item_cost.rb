module Calculators
  class ItemCost
    include Constants::Rates
    include Constants::BusinessRules

    def self.call(items:, packing_type:, manual_packing_cost: nil, volumetric_divisor: 5000, carrier: 'UPS')
      new(items, packing_type, manual_packing_cost, volumetric_divisor, carrier).call
    end

    def initialize(items, packing_type, manual_packing_cost, volumetric_divisor, carrier)
      @items = items
      @packing_type = packing_type
      @manual_packing_cost = manual_packing_cost
      @volumetric_divisor = volumetric_divisor
      @carrier = carrier
    end

    def call
      total_actual_weight = 0
      total_packed_volumetric_weight = 0
      total_cbm = 0
      packing_material_cost = 0
      packing_labor_cost = 0
      ups_surge_cost = 0
      warnings = []

      @items.each_with_index do |item, index|
        # item is likely a hash or object. Assuming hash from JSON.
        l = item[:length].to_f
        w = item[:width].to_f
        h = item[:height].to_f
        weight = item[:weight].to_f
        quantity = item[:quantity].to_i

        # Packing impact
        if @packing_type != 'NONE'
          l += 10
          w += 10
          h += 15
          weight = weight * PACKING_WEIGHT_BUFFER + PACKING_WEIGHT_ADDITION

          surface_area_m2 = (2 * (l*w + l*h + w*h)) / 10000.0
          packing_material_cost += surface_area_m2 * PACKING_MATERIAL_BASE_COST * quantity
          labor_per_item = @packing_type == 'VACUUM' ? PACKING_LABOR_UNIT_COST * 1.5 : PACKING_LABOR_UNIT_COST
          packing_labor_cost += labor_per_item * quantity
        end

        # Surge/AHS auto-calculation disabled — currently suspended by carriers.
        # Manual surge input is available via manualSurgeCost in QuoteCalculator.
        # When surge is reactivated, uncomment the block below.
        # if @carrier == 'UPS'
        #   quantity.times do |q|
        #     surge_result = Calculators::SurgeCost.call(
        #       length: l,
        #       width: w,
        #       height: h,
        #       weight: weight,
        #       packing_type: @packing_type,
        #       item_index: index
        #     )
        #     ups_surge_cost += surge_result[:surge_cost]
        #     if q == 0
        #       warnings.concat(surge_result[:warnings])
        #     end
        #   end
        # end

        total_actual_weight += weight * quantity
        total_packed_volumetric_weight += calculate_volumetric_weight(l, w, h, @volumetric_divisor) * quantity
        total_cbm += calculate_cbm(l, w, h) * quantity
      end

      # Manual Override Logic
      if @manual_packing_cost && @manual_packing_cost >= 0
        packing_material_cost = @manual_packing_cost
        packing_labor_cost = 0
      end

      {
        total_actual_weight: total_actual_weight,
        total_packed_volumetric_weight: total_packed_volumetric_weight,
        total_cbm: total_cbm,
        packing_material_cost: packing_material_cost,
        packing_labor_cost: packing_labor_cost,
        ups_surge_cost: ups_surge_cost,
        warnings: warnings
      }
    end

    private

    def calculate_volumetric_weight(l, w, h, divisor)
      (l.ceil * w.ceil * h.ceil) / divisor.to_f
    end

    def calculate_cbm(l, w, h)
      (l * w * h) / 1000000.0
    end
  end
end
