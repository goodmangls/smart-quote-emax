import React, { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/browser';
import { fetchAuditLogs, AuditLogEntry, AuditLogFilters } from '@/api/auditLogApi';
import { Search, ChevronLeft, ChevronRight, FileText, Trash2, Mail, RefreshCw, Edit, Download, AlertCircle } from 'lucide-react';

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'quote.created': { label: 'Created', icon: <FileText className="w-3.5 h-3.5" />, color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30' },
  'quote.updated': { label: 'Updated', icon: <Edit className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' },
  'quote.status_changed': { label: 'Status', icon: <RefreshCw className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30' },
  'quote.deleted': { label: 'Deleted', icon: <Trash2 className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30' },
  'quote.email_sent': { label: 'Emailed', icon: <Mail className="w-3.5 h-3.5" />, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30' },
  'quote.exported': { label: 'Exported', icon: <Download className="w-3.5 h-3.5" />, color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800' },
};

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'quote.created', label: 'Created' },
  { value: 'quote.updated', label: 'Updated' },
  { value: 'quote.status_changed', label: 'Status Changed' },
  { value: 'quote.deleted', label: 'Deleted' },
  { value: 'quote.email_sent', label: 'Email Sent' },
  { value: 'quote.exported', label: 'Exported' },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MetadataDisplay({ metadata, action }: { metadata: Record<string, unknown>; action: string }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  if (action === 'quote.status_changed' && metadata.status_from && metadata.status_to) {
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {String(metadata.status_from)} → {String(metadata.status_to)}
      </span>
    );
  }
  if (action === 'quote.email_sent' && metadata.recipient) {
    return <span className="text-xs text-gray-500 dark:text-gray-400">→ {String(metadata.recipient)}</span>;
  }
  if (action === 'quote.exported' && metadata.count) {
    return <span className="text-xs text-gray-500 dark:text-gray-400">{String(metadata.count)} quotes</span>;
  }
  if (action === 'quote.deleted' && metadata.reference_no) {
    return <span className="text-xs text-gray-500 dark:text-gray-400">{String(metadata.reference_no)}</span>;
  }
  return null;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, perPage: 20 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs(filters);
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      Sentry.captureException(err);
      const msg = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(msg.includes('404') || msg.includes('500') ? 'Backend deploying — audit log will be available shortly' : msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, q: searchInput || undefined, page: 1 }));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-jways-600 dark:text-jways-400" />
              Audit Log
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {totalCount} total entries
            </p>
          </div>
          <button
            onClick={load}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-label="Refresh audit logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search ref no, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-jways-500"
            />
          </form>
          <select
            value={filters.actionType || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, actionType: e.target.value || undefined, page: 1 }))}
            className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-jways-500"
          >
            {ACTION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {error ? (
          <div className="flex items-center gap-2 px-4 py-8 justify-center text-red-500 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No audit log entries found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log) => {
              const config = ACTION_LABELS[log.action] || { label: log.action, icon: <FileText className="w-3.5 h-3.5" />, color: 'text-gray-600 bg-gray-50' };
              return (
                <div key={log.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {config.label}
                      </span>
                      {log.resourceRef && (
                        <span className="text-xs font-mono text-jways-600 dark:text-jways-400">
                          {log.resourceRef}
                        </span>
                      )}
                      <MetadataDisplay metadata={log.metadata} action={log.action} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {log.userName || 'System'}
                      </span>
                      {log.ipAddress && (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600">
                          {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {filters.page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              disabled={filters.page === 1}
              className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:text-gray-300"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
              disabled={filters.page === totalPages}
              className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:text-gray-300"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
