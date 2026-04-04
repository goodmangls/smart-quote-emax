/**
 * Packing dimension/weight utilities.
 * Extracts the duplicated `l += 10; w += 10; h += 15; weight = weight * 1.1 + 10`
 * pattern used in 6+ locations.
 */

import { PACKING_WEIGHT_BUFFER, PACKING_WEIGHT_ADDITION } from '@/config/business-rules';
import { PackingType } from '@/types';

export const PACKING_DIM_ADDITIONS = { length: 10, width: 10, height: 15 } as const;

export const applyPackingDimensions = (
  l: number,
  w: number,
  h: number,
  weight: number,
  packingType: PackingType
): { l: number; w: number; h: number; weight: number } => {
  if (packingType === PackingType.NONE) return { l, w, h, weight };
  return {
    l: l + PACKING_DIM_ADDITIONS.length,
    w: w + PACKING_DIM_ADDITIONS.width,
    h: h + PACKING_DIM_ADDITIONS.height,
    weight: weight * PACKING_WEIGHT_BUFFER + PACKING_WEIGHT_ADDITION,
  };
};
