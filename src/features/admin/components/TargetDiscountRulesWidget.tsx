import React, { useState } from 'react';
import * as Sentry from '@sentry/browser';
import { Percent, RefreshCw, Plus, Save, Loader2, Trash2, X, XCircle, User, Globe, Weight } from 'lucide-react';
import { useDiscountRules } from '@/features/dashboard/hooks/useDiscountRules';
import { createDiscountRule, updateDiscountRule, deleteDiscountRule, type DiscountRule } from '@/api/discountRuleApi';
import { useToast } from '@/components/ui/Toast';
import { NATIONALITY_OPTIONS, getCountryDisplayName } from '@/config/options';

const EMPTY_FORM: Partial<DiscountRule> = {
  name: '',
  ruleType: 'weight_based',
  priority: 50,
  matchEmail: null,
  matchNationality: null,
  weightMin: null,
  weightMax: null,
  discountPercent: 19,
};

function priorityLabel(p: number) {
  if (p >= 100) return 'Per-User Flat';
  if (p >= 90) return 'Per-User Weight-Based';
  if (p >= 50) return 'Nationality';
  return 'Default';
}

function priorityColor(p: number) {
  if (p >= 100) return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' };
  if (p >= 90) return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' };
  if (p >= 50) return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' };
  return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' };
}

function PriorityIcon({ priority }: { priority: number }) {
  if (priority >= 100) return <User className="w-3.5 h-3.5" />;
  if (priority >= 50) return <Globe className="w-3.5 h-3.5" />;
  return <Weight className="w-3.5 h-3.5" />;
}

function conditionLabel(rule: DiscountRule): string {
  const parts: string[] = [];
  if (rule.matchEmail) parts.push(rule.matchEmail);
  if (rule.matchNationality) parts.push(getCountryDisplayName(rule.matchNationality));
  if (rule.weightMin !== null && rule.weightMax !== null) {
    parts.push(`${rule.weightMin}–${rule.weightMax}kg`);
  } else if (rule.weightMin !== null) {
    parts.push(`≥ ${rule.weightMin}kg`);
  } else if (rule.weightMax !== null) {
    parts.push(`< ${rule.weightMax}kg`);
  }
  if (rule.ruleType === 'flat') parts.push('All weights');
  return parts.join(' · ') || 'All';
}

export const TargetDiscountRulesWidget: React.FC = () => {
  const { rules, loading, error, refetch } = useDiscountRules();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<DiscountRule>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const activeRules = rules.filter(r => r.isActive);

  const groupedRules = activeRules.reduce<Record<string, DiscountRule[]>>((acc, rule) => {
    const label = priorityLabel(rule.priority);
    if (!acc[label]) acc[label] = [];
    acc[label].push(rule);
    return acc;
  }, {});

  const startEdit = (rule: DiscountRule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      ruleType: rule.ruleType,
      priority: rule.priority,
      matchEmail: rule.matchEmail,
      matchNationality: rule.matchNationality,
      weightMin: rule.weightMin,
      weightMax: rule.weightMax,
      discountPercent: rule.discountPercent,
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        rule_type: form.ruleType,
        priority: form.priority,
        match_email: form.matchEmail || null,
        match_nationality: form.matchNationality || null,
        weight_min: form.weightMin ?? null,
        weight_max: form.weightMax ?? null,
        discount_percent: form.discountPercent,
      };

      if (editingId) {
        await updateDiscountRule(editingId, payload as Partial<DiscountRule>);
      } else {
        await createDiscountRule(payload as Partial<DiscountRule>);
      }
      cancelEdit();
      await refetch();
    } catch (e) {
      Sentry.captureException(e);
      toast('error', e instanceof Error ? e.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await deleteDiscountRule(id);
      await refetch();
    } catch (e) {
      Sentry.captureException(e);
      toast('error', e instanceof Error ? e.message : 'Failed to delete rule');
    } finally {
      setDeletingId(null);
    }
  };

  const renderForm = () => (
    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Rule name"
          value={form.name || ''}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500">Type</label>
            <select
              value={form.ruleType || 'weight_based'}
              onChange={(e) => setForm(f => ({ ...f, ruleType: e.target.value as 'flat' | 'weight_based' }))}
              className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="flat">Flat</option>
              <option value="weight_based">Weight-based</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Priority</label>
            <input
              type="number"
              min={0}
              max={200}
              value={form.priority ?? 50}
              onChange={(e) => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500">Match Email</label>
            <input
              type="text"
              placeholder="(optional)"
              value={form.matchEmail || ''}
              onChange={(e) => setForm(f => ({ ...f, matchEmail: e.target.value || null }))}
              className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Match Nationality</label>
            <select
              value={form.matchNationality || ''}
              onChange={(e) => setForm(f => ({ ...f, matchNationality: e.target.value || null }))}
              className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">— Any —</option>
              {NATIONALITY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-gray-500">Weight Min (kg)</label>
            <input
              type="number"
              step="0.5"
              placeholder="—"
              value={form.weightMin ?? ''}
              onChange={(e) => setForm(f => ({ ...f, weightMin: e.target.value ? Number(e.target.value) : null }))}
              className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Weight Max (kg)</label>
            <input
              type="number"
              step="0.5"
              placeholder="—"
              value={form.weightMax ?? ''}
              onChange={(e) => setForm(f => ({ ...f, weightMax: e.target.value ? Number(e.target.value) : null }))}
              className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Discount %</label>
            <input
              type="number"
              step="0.5"
              min={5}
              max={50}
              value={form.discountPercent ?? 19}
              onChange={(e) => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={cancelEdit} className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-gray-600">
            <X className="w-3 h-3" /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="flex items-center gap-1 text-[10px] font-semibold text-emax-600 hover:text-emax-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-emax-500" />
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
            Target Discount Rules
          </h4>
          <span className="text-[10px] text-gray-400">({activeRules.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setForm(EMPTY_FORM); }}
            className="text-[10px] font-semibold text-gray-500 hover:text-emax-600 dark:text-gray-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="text-[10px] font-semibold text-gray-500 hover:text-emax-600 dark:text-gray-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error indicator */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={refetch} className="underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && renderForm()}

      {/* Loading */}
      {loading && activeRules.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {Object.entries(groupedRules).map(([group, groupRules]) => {
            const colors = priorityColor(groupRules[0].priority);
            return (
              <div key={group} className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={colors.icon}><PriorityIcon priority={groupRules[0].priority} /></span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    P{groupRules[0].priority} — {group}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {groupRules.map((rule) => (
                    editingId === rule.id ? (
                      <div key={rule.id}>{renderForm()}</div>
                    ) : (
                      <div key={rule.id} className={`flex items-center justify-between ${colors.bg} rounded-lg px-3 py-2 group`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{rule.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{conditionLabel(rule)}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`text-sm font-bold ${colors.text}`}>{rule.discountPercent}%</span>
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button
                              onClick={() => startEdit(rule)}
                              className="text-[10px] font-semibold text-gray-400 hover:text-emax-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(rule.id)}
                              disabled={deletingId === rule.id}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              {deletingId === rule.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300 mb-2">
            Are you sure you want to delete this rule? This will deactivate it.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(confirmDeleteId)}
              className="text-[10px] font-semibold text-red-600 hover:text-red-800 px-2 py-1"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          Priority: higher wins · Visibility: hidden for member role
        </span>
      </div>
    </div>
  );
};
