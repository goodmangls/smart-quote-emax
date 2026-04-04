import React from 'react';
import { Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { type SurchargeRule } from '@/api/surchargeApi';
import { chargeTypeLabel, carrierBadge } from './surchargeUtils';

interface SurchargeTableProps {
  surcharges: SurchargeRule[];
  confirmDeleteId: number | null;
  deletingId: number | null;
  onEdit: (rule: SurchargeRule) => void;
  onConfirmDelete: (id: number) => void;
  onDelete: (id: number) => void;
}

export const SurchargeTable: React.FC<SurchargeTableProps> = ({
  surcharges,
  confirmDeleteId,
  deletingId,
  onEdit,
  onConfirmDelete,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
            <th className="text-left px-3 py-2 font-semibold">Code / Name</th>
            <th className="text-center px-2 py-2 font-semibold">Carrier</th>
            <th className="text-center px-2 py-2 font-semibold">Type</th>
            <th className="text-right px-2 py-2 font-semibold">Amount</th>
            <th className="text-center px-2 py-2 font-semibold">Status</th>
            <th className="text-right px-3 py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {surcharges.map(rule => (
            <tr
              key={rule.id}
              className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${!rule.isActive ? 'opacity-50' : ''}`}
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <div>
                    <span className="font-mono text-[10px] text-gray-400">{rule.code}</span>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{rule.name}</p>
                    {rule.nameKo && <p className="text-[10px] text-gray-400">{rule.nameKo}</p>}
                    {rule.countryCodes.length > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Countries: {rule.countryCodes.join(', ')}
                      </p>
                    )}
                  </div>
                  {rule.sourceUrl && (
                    <a href={rule.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-jways-500 flex-shrink-0">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </td>
              <td className="px-2 py-2 text-center">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${carrierBadge(rule.carrier)}`}>
                  {rule.carrier || 'ALL'}
                </span>
              </td>
              <td className="px-2 py-2 text-center">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                  rule.chargeType === 'rate'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {rule.chargeType === 'rate' ? 'Rate' : 'Fixed'}
                </span>
              </td>
              <td className="px-2 py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                {chargeTypeLabel(rule.chargeType, rule.amount)}
              </td>
              <td className="px-2 py-2 text-center">
                <span className={`inline-block w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => onEdit(rule)}
                    className="text-[10px] font-semibold text-gray-400 hover:text-jways-600 transition-colors"
                  >
                    Edit
                  </button>
                  {confirmDeleteId === rule.id ? (
                    <button
                      onClick={() => onDelete(rule.id)}
                      disabled={deletingId === rule.id}
                      className="text-[10px] font-semibold text-red-600 hover:text-red-700"
                    >
                      {deletingId === rule.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                    </button>
                  ) : (
                    <button
                      onClick={() => onConfirmDelete(rule.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
