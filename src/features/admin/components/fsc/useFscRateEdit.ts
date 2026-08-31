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
 * PARTIALLY updated and quotes silently split between two weeks' rates.
 *
 * The three groups are NOT interchangeable, and collapsing them lies to the
 * admin. A thrown request only means the CLIENT never saw a response — a
 * timeout, a dropped connection or a 502 can all arrive after the server has
 * already committed the row. So the carrier that failed is *indeterminate*,
 * not "unchanged"; only the carriers never attempted are certainly unchanged.
 * The caller re-reads the table on failure and the widget then shows each row's
 * real value under its input ("현재 DB"), so the honest move is to point the
 * admin at that rather than assert a DB state we cannot know. Keep this wording
 * and that label in step — editing stays open on failure, so the cells otherwise
 * show only what the admin typed and the advice would point at nothing.
 */
function describeSaveFailure(
  written: readonly EditableFscCarrier[],
  failed: EditableFscCarrier | null,
): string {
  const untouched = EDITABLE_FSC_CARRIERS.filter(
    (carrier) => !written.includes(carrier) && carrier !== failed,
  );

  const parts = ['요율을 모두 저장하지 못했습니다.'];

  if (written.length > 0) {
    parts.push(`${written.join('·')} 는 저장됐습니다.`);
  }
  if (failed) {
    parts.push(
      `${failed} 는 응답을 받지 못해 반영 여부가 확실하지 않습니다 — 입력칸 아래 '현재 DB' 값으로 확인해 주세요.`,
    );
  }
  if (untouched.length > 0) {
    parts.push(`${untouched.join('·')} 는 시도되지 않아 이전 요율입니다.`);
  }

  return parts.join(' ');
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
    // The carrier whose request is in flight. Held pessimistically so that if the
    // await throws we know exactly which one has an unknown outcome, rather than
    // lumping it in with the carriers we never sent.
    let inFlight: EditableFscCarrier | null = null;

    try {
      // Sequential on purpose: each call writes an audit log row, and a stable
      // order keeps that trail readable — and makes `written` an exact prefix,
      // so a failure can name precisely which carriers landed.
      for (const carrier of EDITABLE_FSC_CARRIERS) {
        const rate = parseFloat(editRates[carrier]);
        if (!isNaN(rate)) {
          inFlight = carrier;
          await updateFscRate(carrier, rate, rate);
          written.push(carrier);
          inFlight = null;
        }
      }
      await fetchRates();
      setIsEditing(false);
    } catch (err) {
      // NOT swallowed: useFscRates' error state only covers the GET, so a failed
      // POST reported nothing at all — the admin saw the form sitting there and
      // had no way to know the table was half-written.
      Sentry.captureException(err);
      setSaveError(describeSaveFailure(written, inFlight));
      // Re-read regardless, so the widget can show what is actually in the table
      // rather than what the admin thought they saved. Editing stays open so the
      // partial write stays visible and re-submittable.
      //
      // No try/catch here: `fetchRates` is useFscRates' `retry`, which swallows
      // its own failure into that hook's `error` state and never rejects. The
      // widget reads that state — a failed re-read must NOT be rendered as a
      // confirmed "현재 DB" value, because `data` then still holds the pre-save
      // read. That is the likely path, too: a POST that died on the network is
      // usually followed by a GET that dies the same way.
      await fetchRates();
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
