import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<Props> = ({ title, icon, badge, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
            {title}
          </h4>
          {badge}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && children}
    </div>
  );
};
