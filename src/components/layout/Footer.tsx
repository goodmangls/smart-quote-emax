import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-8 border-t border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('landing.footer').replace('2026', String(new Date().getFullYear()))}
        </p>
      </div>
    </footer>
  );
};
