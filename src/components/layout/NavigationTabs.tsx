import React from 'react';
import { Calculator, History } from 'lucide-react';

export type AppView = 'calculator' | 'history';

interface Props {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export const NavigationTabs: React.FC<Props> = ({ currentView, onViewChange }) => {
  return (
    <nav role="tablist" className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
      <button
        role="tab"
        aria-selected={currentView === 'calculator'}
        aria-label="Calculator"
        onClick={() => onViewChange('calculator')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          currentView === 'calculator'
            ? 'bg-white dark:bg-gray-600 text-jways-600 dark:text-jways-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <Calculator className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Calculator</span>
      </button>
      <button
        role="tab"
        aria-selected={currentView === 'history'}
        aria-label="History"
        onClick={() => onViewChange('history')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          currentView === 'history'
            ? 'bg-white dark:bg-gray-600 text-jways-600 dark:text-jways-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <History className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">History</span>
      </button>
    </nav>
  );
};
