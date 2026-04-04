import React, { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { Shield, RefreshCw, Plus, Loader2, AlertCircle } from 'lucide-react';
import { getSurcharges, createSurcharge, updateSurcharge, deleteSurcharge, type SurchargeRule } from '@/api/surchargeApi';
import { useToast } from '@/components/ui/Toast';
import { SurchargeForm, SurchargeTable, SurchargeCarrierLinks, SurchargeNotice, EMPTY_FORM } from './surcharge';

export const SurchargeManagementWidget: React.FC = () => {
  const { toast } = useToast();
  const [surcharges, setSurcharges] = useState<SurchargeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<SurchargeRule>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getSurcharges();
      setSurcharges(res.surcharges);
    } catch (err) {
      Sentry.captureException(err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load surcharges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEdit = (rule: SurchargeRule) => {
    setEditingId(rule.id);
    setShowAddForm(false);
    setForm({
      code: rule.code,
      name: rule.name,
      nameKo: rule.nameKo || '',
      carrier: rule.carrier || '',
      zone: rule.zone || '',
      countryCodes: rule.countryCodes,
      chargeType: rule.chargeType,
      amount: rule.amount,
      effectiveFrom: rule.effectiveFrom.slice(0, 10),
      effectiveTo: rule.effectiveTo?.slice(0, 10) || null,
      isActive: rule.isActive,
      sourceUrl: rule.sourceUrl || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.code || !form.name || form.amount === undefined) {
      toast('error', 'Code, Name, and Amount are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        countryCodes: typeof form.countryCodes === 'string'
          ? (form.countryCodes as string).split(',').map(s => s.trim()).filter(Boolean)
          : form.countryCodes,
        carrier: form.carrier || null,
        zone: form.zone || null,
        effectiveTo: form.effectiveTo || null,
        sourceUrl: form.sourceUrl || null,
        nameKo: form.nameKo || null,
      };

      if (editingId) {
        await updateSurcharge(editingId, payload);
        toast('success', 'Surcharge updated.');
      } else {
        await createSurcharge(payload);
        toast('success', 'Surcharge created.');
      }
      cancelEdit();
      await fetchData();
    } catch (e) {
      Sentry.captureException(e);
      toast('error', 'Failed to save surcharge.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteSurcharge(id);
      toast('success', 'Surcharge deleted.');
      setConfirmDeleteId(null);
      await fetchData();
    } catch (e) {
      Sentry.captureException(e);
      toast('error', 'Failed to delete surcharge.');
    } finally {
      setDeletingId(null);
    }
  };

  const updateForm = (key: string, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const activeSurcharges = surcharges.filter(s => s.isActive);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
            Surcharge Management
          </h4>
          <span className="text-[10px] text-gray-400 font-mono">({activeSurcharges.length} active)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-1 text-[10px] font-semibold text-jways-600 hover:text-jways-700 dark:text-jways-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-[10px] font-semibold text-gray-500 hover:text-jways-600 dark:text-gray-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <SurchargeForm
          form={form}
          editingId={editingId}
          saving={saving}
          onUpdateForm={updateForm}
          onSave={handleSave}
          onCancel={cancelEdit}
        />
      )}

      {/* Surcharge List */}
      {loadError && surcharges.length === 0 ? (
        <div className="p-6 text-center text-xs text-red-500">
          <AlertCircle className="w-4 h-4 mx-auto mb-1" />
          {loadError}
          <button onClick={fetchData} className="ml-2 underline hover:no-underline">Retry</button>
        </div>
      ) : loading && surcharges.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        </div>
      ) : surcharges.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-400">
          No surcharges configured. Click &ldquo;Add&rdquo; to create one.
        </div>
      ) : (
        <SurchargeTable
          surcharges={surcharges}
          confirmDeleteId={confirmDeleteId}
          deletingId={deletingId}
          onEdit={startEdit}
          onConfirmDelete={setConfirmDeleteId}
          onDelete={handleDelete}
        />
      )}

      {/* Carrier Official Links */}
      <SurchargeCarrierLinks />

      {/* Notice */}
      <SurchargeNotice />
    </div>
  );
};
