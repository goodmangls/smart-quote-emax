import React, { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { Customer, CustomerInput, listCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api/customerApi';
import { COUNTRY_OPTIONS } from '@/config/options';
import { Building2, Plus, Search, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerInput>({ companyName: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCustomers(search || undefined);
      setCustomers(data);
    } catch (e) {
      Sentry.captureException(e);
      setError(e instanceof Error ? e.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const resetForm = () => {
    setForm({ companyName: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (c: Customer) => {
    setForm({
      companyName: c.companyName,
      contactName: c.contactName || '',
      email: c.email || '',
      phone: c.phone || '',
      country: c.country || 'KR',
      address: c.address || '',
      notes: c.notes || '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateCustomer(editingId, form);
      } else {
        await createCustomer(form);
      }
      setError(null);
      toast('success', editingId ? 'Customer updated' : 'Customer created');
      resetForm();
      fetchCustomers();
    } catch (e) {
      Sentry.captureException(e);
      setError(e instanceof Error ? e.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer(deleteTarget.id);
      setError(null);
      toast('success', `"${deleteTarget.name}" deleted`);
      fetchCustomers();
    } catch (e) {
      Sentry.captureException(e);
      setError(e instanceof Error ? e.message : 'Failed to delete customer');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-jways-500" />
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
            Customer Management
          </h4>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1 text-[10px] font-semibold text-jways-600 hover:text-jways-700 dark:text-jways-400 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-jways-500"
          />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-jways-50/30 dark:bg-jways-900/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {editingId ? 'Edit Customer' : 'New Customer'}
            </span>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              placeholder="Company Name *"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="col-span-2 px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              placeholder="Contact Name"
              value={form.contactName || ''}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className="px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              placeholder="Phone"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <select
              value={form.country || 'KR'}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <input
            placeholder="Address"
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !form.companyName.trim()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-jways-600 rounded-lg hover:bg-jways-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 p-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No customers found
          </div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{c.companyName}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {[c.contactName, c.email].filter(Boolean).join(' · ') || 'No contact info'}
                  {c.quoteCount > 0 && <span className="ml-1.5 text-jways-500">({c.quoteCount} quotes)</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="p-1 text-gray-400 hover:text-jways-600 transition-colors"
                  aria-label={`Edit ${c.companyName}`}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: c.id, name: c.companyName })}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Delete ${c.companyName}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Delete "${deleteTarget?.name}"? Associated quotes will be unlinked.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
