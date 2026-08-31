import { useState } from 'react';
import * as Sentry from '@sentry/browser';
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

/**
 * Each carrier is its own POST, so a mid-run failure leaves `fsc_rates`
 * PARTIALLY updated: the carriers already written charge the new rate while the
 * rest still charge the old one, and quotes silently split between the two.
 * Naming both halves is the whole point of this message — "저장 실패" alone
 * would leave the admin unable to tell which state the table is in.
 */
function describeSaveFailure(written: readonly EditableFscCarrier[]): string {
  if (written.length === 0) {
    return '요율을 저장하지 못했습니다. 변경된 캐리어는 없습니다.';
  }

  const pending = EDITABLE_FSC_CARRIERS.filter((carrier) => !written.includes(carrier));

  return `일부만 저장됐습니다 — ${written.join('·')} 는 새 요율, ${pending.join('·')} 는 이전 요율입니다. 다시 저장해 주세요.`;
}

export function useFscRateEdit(data: FscRates | null, fetchRates: () => Promise<void> | void) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editRates, setEditRates] = useState<FscEditRates>(EMPTY_EDIT_RATES);

  const handleEditStart = () => {
    setEditRates(
      Object.fromEntries(
        EDITABLE_FSC_CARRIERS.map((carrier) => [
          carrier,
          String(data?.rates[carrier]?.international ?? ''),
        ]),
      ) as FscEditRates,
    );
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const written: EditableFscCarrier[] = [];

    try {
      // Sequential on purpose: each call writes an audit log row, and a stable
      // order keeps that trail readable — and makes `written` an exact prefix,
      // so a failure can name precisely which carriers landed.
      for (const carrier of EDITABLE_FSC_CARRIERS) {
        const rate = parseFloat(editRates[carrier]);
        if (!isNaN(rate)) {
          await updateFscRate(carrier, rate, rate);
          written.push(carrier);
        }
      }
      await fetchRates();
      setIsEditing(false);
    } catch (err) {
      // NOT swallowed: useFscRates' error state only covers the GET, so a failed
      // POST reported nothing at all — the admin saw the form sitting there and
      // had no way to know the table was half-written.
      Sentry.captureException(err);
      setSaveError(describeSaveFailure(written));
      // Re-read regardless, so the widget shows what is actually in the table
      // rather than what the admin thought they saved. Editing stays open so the
      // partial write stays visible and re-submittable.
      try {
        await fetchRates();
      } catch {
        // The read failure is already surfaced by useFscRates' own error state.
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSaveError(null);
    setIsEditing(false);
  };

  return {
    isEditing,
    saving,
    saveError,
    editRates,
    setEditRates,
    handleEditStart,
    handleSave,
    handleCancel,
  };
}
