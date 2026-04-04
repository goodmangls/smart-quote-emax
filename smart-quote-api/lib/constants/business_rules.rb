module Constants
  module BusinessRules
    SURGE_THRESHOLDS = {
        AHS_WEIGHT_KG: 25,
        AHS_DIM_LONG_SIDE_CM: 122, 
        AHS_DIM_SECOND_SIDE_CM: 76,
        LPS_LENGTH_GIRTH_CM: 300, 
        MAX_LIMIT_LENGTH_CM: 274, 
        MAX_LIMIT_GIRTH_CM: 400
    }

    TRUCK_TIER_LIMITS = [
        { maxWeight: 100, maxCBM: 1, label: "~100kg Pickup" },
        { maxWeight: 500, maxCBM: 3, label: "~500kg Pickup" },
        { maxWeight: 1100, maxCBM: Float::INFINITY, label: "1t Truck" },
        { maxWeight: 3500, maxCBM: Float::INFINITY, label: "3.5t Truck" },
        { maxWeight: 5000, maxCBM: Float::INFINITY, label: "5t Truck" },
        { maxWeight: 11000, maxCBM: Float::INFINITY, label: "11t Truck" }
    ]

    PACKING_WEIGHT_BUFFER = 1.1 
    PACKING_WEIGHT_ADDITION = 10 
    INITIAL_DISCOUNT = 15
  end
end
