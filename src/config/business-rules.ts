export const SURGE_THRESHOLDS = {
  AHS_WEIGHT_KG: 25, // Additional Handling > 25kg
  AHS_DIM_LONG_SIDE_CM: 122, // Longest side > 122cm
  AHS_DIM_SECOND_SIDE_CM: 76, // Second longest > 76cm
  LPS_LENGTH_GIRTH_CM: 300, // Large Package: Length + 2W + 2H > 300cm
  MAX_LIMIT_LENGTH_CM: 274, // Over Max Limits
  MAX_LIMIT_GIRTH_CM: 400,
};

export const MAX_DISCOUNT_PERCENT = 80; // Maximum discount rate (%)

export const PACKING_WEIGHT_BUFFER = 1.1; // 10% weight increase
export const PACKING_WEIGHT_ADDITION = 10; // 10kg addition per item

// Billable weight policy (implemented in calculationService.ts):
//  - Single box (Σ quantity === 1): max(Σ actual, Σ volumetric) — legacy total model.
//  - Multi-box (2+ physical boxes): per-box billing — round each box's chargeable
//    weight max(actual, volumetric) up to 0.5kg individually, then sum
//    (Σᵢ roundToHalf(max(actualᵢ, volumetricᵢ))). E-MAX confirmed for 2+ boxes.
//  Mirrored in backend item_cost.rb / quote_calculator.rb.
