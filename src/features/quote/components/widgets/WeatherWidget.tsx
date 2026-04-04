import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, CloudDrizzle, ChevronLeft, ChevronRight, Plane, Ship } from 'lucide-react';
import { usePortWeather } from '@/features/dashboard/hooks/usePortWeather';
import { WidgetSkeleton } from '@/features/dashboard/components/WidgetSkeleton';
import { WidgetError } from '@/features/dashboard/components/WidgetError';
import { PORTS_PER_PAGE } from '@/config/ports';
import type { PortWeather } from '@/types/dashboard';

const iconMap: Record<string, React.ReactNode> = {
  Sun: <Sun className="w-5 h-5 text-amber-500" />,
  Cloud: <Cloud className="w-5 h-5 text-gray-400" />,
  CloudRain: <CloudRain className="w-5 h-5 text-blue-500" />,
  CloudDrizzle: <CloudDrizzle className="w-5 h-5 text-blue-400" />,
  CloudSnow: <CloudSnow className="w-5 h-5 text-cyan-400" />,
  CloudLightning: <CloudLightning className="w-5 h-5 text-purple-500" />,
  CloudFog: <CloudFog className="w-5 h-5 text-gray-300" />,
  Wind: <Wind className="w-5 h-5 text-teal-400" />,
};

function getIcon(weather: PortWeather): React.ReactNode {
  const { condition } = weather;
  if (condition === 'Clear') return iconMap.Sun;
  if (condition === 'Cloudy') return iconMap.Cloud;
  if (condition === 'Rain') return iconMap.CloudRain;
  if (condition === 'Drizzle') return iconMap.CloudDrizzle;
  if (condition === 'Snow') return iconMap.CloudSnow;
  if (condition === 'Storm') return iconMap.CloudLightning;
  if (condition === 'Fog') return iconMap.CloudFog;
  if (condition === 'Windy') return iconMap.Wind;
  return iconMap.Cloud;
}

const statusBadge: Record<string, string> = {
  Normal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Delay: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const AUTO_ROTATE_MS = 5000;

export const WeatherWidget: React.FC = () => {
  const { t } = useLanguage();
  const { data, loading, error, retry } = usePortWeather();
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(data.length / PORTS_PER_PAGE));
  const needsPagination = data.length > PORTS_PER_PAGE;
  const safePage = Math.min(currentPage, totalPages - 1);
  const pageData = data.slice(safePage * PORTS_PER_PAGE, (safePage + 1) * PORTS_PER_PAGE);

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
                <Sun className="w-4 h-4 mr-2 text-jways-500" />
                {t('widget.weather')}
            </h3>
            {needsPagination && !loading && !error && (
              <span className="text-[10px] text-gray-400 dark:text-gray-400">
                {safePage + 1} / {totalPages}
              </span>
            )}
        </div>
        <div className="p-5">
            {loading && <WidgetSkeleton lines={6} />}
            {error && <WidgetError message={error} onRetry={retry} />}
            {!loading && !error && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {pageData.map((weather) => (
                        <div key={weather.code} className="flex flex-col bg-gray-50 dark:bg-jways-900/40 p-3 rounded-xl border border-gray-100 dark:border-jways-700/50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                  {weather.type === 'airport'
                                    ? <Plane className="w-5 h-5 text-sky-500 shrink-0" />
                                    : <Ship className="w-5 h-5 text-blue-500 shrink-0" />}
                                  {weather.port}
                                </span>
                                {getIcon(weather)}
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <span className="text-lg font-extrabold text-gray-900 dark:text-white">{weather.temperature}°C</span>
                                <span className={`text-xs sm:text-[10px] uppercase font-bold px-2 sm:px-1.5 py-1 sm:py-0.5 rounded ${statusBadge[weather.status] || statusBadge.Normal}`}>
                                    {weather.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {needsPagination && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-jways-700">
                    <button
                      type="button"
                      onClick={prevPage}
                      className="p-2 sm:p-1 rounded-full hover:bg-gray-100 dark:hover:bg-jways-700 text-gray-400 dark:text-gray-400 transition-colors"
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
                      className="p-2 sm:p-1 rounded-full hover:bg-gray-100 dark:hover:bg-jways-700 text-gray-400 dark:text-gray-400 transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 dark:text-gray-400 mt-3 text-center">
                    * {t('widget.weather.desc')}
                </p>
              </>
            )}
        </div>
    </div>
  );
};
