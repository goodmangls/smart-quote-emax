import { UPS_DOC_MAX_KG } from '@/config/ups_tariff';
import { DHL_DOC_MAX_KG } from '@/config/dhl_tariff';
import { FEDEX_DOC_MAX_KG } from '@/config/fedex_tariff';

/** Per-carrier Document rate weight cap (kg). Heavier → Parcel/IP tariff fallback. */
export const getDocumentCapKg = (carrier: string | undefined): number => {
  if (carrier === 'DHL') return DHL_DOC_MAX_KG;
  if (carrier === 'FEDEX') return FEDEX_DOC_MAX_KG;
  return UPS_DOC_MAX_KG;
};
