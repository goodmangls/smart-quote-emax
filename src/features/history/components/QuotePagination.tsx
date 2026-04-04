import React from 'react';
import { Pagination } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export const QuotePagination: React.FC<Props> = ({ pagination, onPageChange }) => {
  if (pagination.totalPages <= 1) return null;

  const start = Math.max(1, Math.min(pagination.currentPage - 2, pagination.totalPages - 4));

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Page {pagination.currentPage} of {pagination.totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage <= 1}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
          const page = start + i;
          if (page > pagination.totalPages) return null;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 text-xs rounded-md font-medium transition-colors ${
                page === pagination.currentPage
                  ? 'bg-jways-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage >= pagination.totalPages}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
