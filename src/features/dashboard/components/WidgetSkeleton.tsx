import React from 'react';

interface WidgetSkeletonProps {
  lines?: number;
}

export const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ lines = 4 }) => {
  return (
    <div className="animate-pulse space-y-3 p-5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="h-4 w-4 rounded bg-gray-200 dark:bg-jways-700" />
          <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-jways-700" />
        </div>
      ))}
    </div>
  );
};
