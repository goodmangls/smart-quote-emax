import { useState } from 'react';
import { updateFscRate } from '@/api/fscApi';
import type { FscRates } from '@/api/fscApi';

/**
 * Percentage carriers the widget can write to `fsc_rates`.
 *
 * EMAX is excluded on purpose: its fuel is charged per kg (`EMAX_FSC_PER_KG`)
 * and `QuoteCalculator#default_fsc_for` returns 0 for it, so a percentage row
 * would be unused at best and picked up by mistake at worst.
 *
 * OCS belongs here even though it updates ad-hoc rather than weekly — it is in
 * `FscRate::SUPPORTED_CARRIERS`, and leaving it out is how its row would stay
 * frozen with nobody noticing.
 */
export const EDITABLE_FSC_CARRIERS = ['UPS', 'DHL', 'FEDEX', 'OCS'] as const;

export type EditableFscCarrier = (typeof EDITABLE_FSC_CARRIERS)[number];

export type FscEditRates = Record<EditableFscCarrier, string>;

const EMPTY_EDIT_RATES: FscEditRates = { UPS: '', DHL: '', FEDEX: '', OCS: '' };

export function useFscRateEdit(data: FscRates | null, fetchRates: () => Promise<void> | void) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editRates, setEditRates] = useState<FscEditRates>(EMPTY_EDIT_RATES);

  const handleEditStart = () => {
    setEditRates(
      Object.fromEntries(
        EDITABLE_FSC_CARRIERS.map((carrier) => [
          carrier,
          String(data?.rates[carrier]?.international ?? ''),
        ])
      ) as FscEditRates
    );
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sequential on purpose: each call writes an audit log row, and a stable
      // order keeps that trail readable.
      for (const carrier of EDITABLE_FSC_CARRIERS) {
        const rate = parseFloat(editRates[carrier]);
        if (!isNaN(rate)) {
          await updateFscRate(carrier, rate, rate);
        }
      }
      await fetchRates();
      setIsEditing(false);
    } catch {
      // Error surfaced via the useFscRates error state.
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => setIsEditing(false);

  return {
    isEditing,
    saving,
    editRates,
    setEditRates,
    handleEditStart,
    handleSave,
    handleCancel,
  };
}
