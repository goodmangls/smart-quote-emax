import React from 'react';
import { Save, Loader2, X } from 'lucide-react';
import { type SurchargeRule } from '@/api/surchargeApi';

interface SurchargeFormProps {
  form: Partial<SurchargeRule>;
  editingId: number | null;
  saving: boolean;
  onUpdateForm: (key: string, value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const SurchargeForm: React.FC<SurchargeFormProps> = ({
  form,
  editingId,
  saving,
  onUpdateForm,
  onSave,
  onCancel,
}) => {
  return (
    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Code *</label>
          <input
            type="text"
            value={form.code || ''}
            onChange={e => onUpdateForm('code', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="WAR_RISK"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Carrier</label>
          <select
            value={form.carrier || ''}
            onChange={e => onUpdateForm('carrier', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Carriers</option>
            <option value="UPS">UPS</option>
            <option value="DHL">DHL</option>
            <option value="EMAX">EMAX</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Name (EN) *</label>
          <input
            type="text"
            value={form.name || ''}
            onChange={e => onUpdateForm('name', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="War Risk Surcharge"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Name (KO)</label>
          <input
            type="text"
            value={form.nameKo || ''}
            onChange={e => onUpdateForm('nameKo', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="전쟁 위험 할증료"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Type</label>
          <select
            value={form.chargeType || 'fixed'}
            onChange={e => onUpdateForm('chargeType', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="fixed">Fixed (KRW)</option>
            <option value="rate">Rate (%)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Amount *</label>
          <input
            type="number"
            step="any"
            value={form.amount ?? 0}
            onChange={e => onUpdateForm('amount', Number(e.target.value))}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Zone</label>
          <input
            type="text"
            value={form.zone || ''}
            onChange={e => onUpdateForm('zone', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Z1,Z2 or empty"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Country Codes</label>
          <input
            type="text"
            value={Array.isArray(form.countryCodes) ? form.countryCodes.join(', ') : form.countryCodes || ''}
            onChange={e => onUpdateForm('countryCodes', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="IL, UA (comma separated, empty = all)"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Source URL</label>
          <input
            type="text"
            value={form.sourceUrl || ''}
            onChange={e => onUpdateForm('sourceUrl', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Effective From</label>
          <input
            type="date"
            value={form.effectiveFrom || ''}
            onChange={e => onUpdateForm('effectiveFrom', e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Effective To</label>
          <input
            type="date"
            value={form.effectiveTo || ''}
            onChange={e => onUpdateForm('effectiveTo', e.target.value || null)}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={e => onUpdateForm('isActive', e.target.checked)}
              className="rounded border-gray-300"
            />
            Active
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-jways-600 hover:bg-jways-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {editingId ? 'Update' : 'Create'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );
};
