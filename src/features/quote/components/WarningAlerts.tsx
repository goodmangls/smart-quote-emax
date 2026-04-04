import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { resultStyles } from './result-styles';

interface Props {
  warnings: string[];
}

export const WarningAlerts: React.FC<Props> = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <div className={resultStyles.warningCardClass}>
        <div className="flex">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">Attention Needed</h3>
                <ul className="list-disc pl-5 mt-1 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
            </div>
        </div>
    </div>
  );
};
