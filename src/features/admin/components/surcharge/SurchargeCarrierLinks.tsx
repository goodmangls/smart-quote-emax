import React from 'react';
import { ExternalLink } from 'lucide-react';
import { CARRIER_LINKS } from './surchargeUtils';

export const SurchargeCarrierLinks: React.FC = () => {
  return (
    <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 flex-wrap">
      {Object.entries(CARRIER_LINKS).map(([key, val]) => (
        <a
          key={key}
          href={val.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-medium text-jways-600 dark:text-jways-400 hover:text-jways-700 dark:hover:text-jways-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          {val.label}
        </a>
      ))}
    </div>
  );
};
