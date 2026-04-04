import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, ExternalLink, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLogisticsNews } from '@/features/dashboard/hooks/useLogisticsNews';
import { WidgetSkeleton } from '@/features/dashboard/components/WidgetSkeleton';
import { WidgetError } from '@/features/dashboard/components/WidgetError';

const ITEMS_PER_PAGE = 5;
const AUTO_ROTATE_MS = 6000;

export const NoticeWidget: React.FC = () => {
  const { t } = useLanguage();
  const { data, loading, error, retry } = useLogisticsNews();
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
  const needsPagination = data.length > ITEMS_PER_PAGE;
  const safePage = Math.min(currentPage, totalPages - 1);
  const pageData = data.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

  // Auto-rotate pages
  useEffect(() => {
    if (!needsPagination || loading || error) return;
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [needsPagination, totalPages, loading, error]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  return (
    <div className="bg-white dark:bg-jways-800 rounded-2xl shadow-sm border border-gray-100 dark:border-jways-700 overflow-hidden transition-colors duration-200">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center text-sm">
                <Bell className="w-4 h-4 mr-2 text-jways-500" />
                {t('widget.notice')}
            </h3>
            {needsPagination && !loading && !error && (
              <span className="text-[10px] text-gray-400 dark:text-gray-400">
                {safePage + 1} / {totalPages}
              </span>
            )}
        </div>
        <div className="p-0">
            {loading && <WidgetSkeleton lines={4} />}
            {error && <WidgetError message={error} onRetry={retry} />}
            {!loading && !error && (
              <>
                <ul className="divide-y divide-gray-100 dark:divide-jways-700">
                    {data.length === 0 ? (
                      <li className="px-5 py-6 text-center text-sm text-gray-400 dark:text-gray-400">
                        {t('dashboard.noNews')}
                      </li>
                    ) : (
                      pageData.map((item, idx) => (
                        <li key={`${safePage}-${idx}`}>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start px-5 py-4 hover:bg-gray-50 dark:hover:bg-jways-700/50 transition-colors group"
                          >
                            <div className="mt-0.5 mr-3 flex-shrink-0">
                              <Newspaper className="w-4 h-4 text-jways-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-jways-600 dark:group-hover:text-jways-400 transition-colors">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.source} · {new Date(item.pubDate).toLocaleDateString()}
                              </p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0 mt-1 group-hover:text-jways-500 transition-colors" />
                          </a>
                        </li>
                      ))
                    )}
                </ul>
                {needsPagination && (
                  <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-100 dark:border-jways-700 bg-gray-50 dark:bg-gray-700/30">
                    <button
                      type="button"
                      onClick={prevPage}
                      className="p-2 sm:p-1 rounded-full hover:bg-gray-200 dark:hover:bg-jways-600 text-gray-400 dark:text-gray-400 transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                    <div className="flex gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => goToPage(i)}
                          aria-label={`Page ${i + 1}`}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            i === safePage
                              ? 'bg-jways-500 w-4'
                              : 'bg-gray-300 dark:bg-jways-600 hover:bg-gray-400 dark:hover:bg-jways-500'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={nextPage}
                      className="p-2 sm:p-1 rounded-full hover:bg-gray-200 dark:hover:bg-jways-600 text-gray-400 dark:text-gray-400 transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
    </div>
  );
};
