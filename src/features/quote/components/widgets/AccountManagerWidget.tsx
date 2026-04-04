import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  UserCircle,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Copy,
  Check,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { AccountManager } from '@/types/dashboard';

const MANAGERS: AccountManager[] = [
  {
    name: 'Charlie Lee',
    nameKo: '이창희',
    role: 'widget.manager.role.ops',
    department: 'widget.manager.dept.ops',
    phone: '+82-2-6961-5763',
    mobile: '+82-10-2620-7048',
    email: 'ch.lee@jways.co.kr',
    available: true,
    workingHours: '09:00 – 18:00 KST',
  },
];


function isWorkingHours(): boolean {
  const now = new Date();
  const kstHour = (now.getUTCHours() + 9) % 24;
  const day = now.getUTCDay();
  return day >= 1 && day <= 5 && kstHour >= 9 && kstHour < 18;
}

export const AccountManagerWidget: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const manager = MANAGERS[currentIdx];
  const totalManagers = MANAGERS.length;
  const isOffice = isWorkingHours();

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback: select text approach (clipboard API may fail in some contexts)
    }
  };

  const goNext = () => setCurrentIdx((prev) => (prev + 1) % totalManagers);
  const goPrev = () => setCurrentIdx((prev) => (prev - 1 + totalManagers) % totalManagers);

  const displayName = language === 'ko' ? manager.nameKo : manager.name;

  return (
    <div className="bg-gradient-to-br from-jways-50 to-white dark:from-jways-900/40 dark:to-jways-800 rounded-2xl shadow-sm border border-jways-100 dark:border-jways-700/50 overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-jways-100/50 dark:border-jways-700/50 flex justify-between items-center">
        <h3 className="font-bold text-jways-800 dark:text-gray-200 flex items-center text-sm">
          <UserCircle className="w-4 h-4 mr-2 text-jways-600 dark:text-jways-400" />
          {t('widget.manager')}
        </h3>
        {totalManagers > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="p-2.5 sm:p-1 text-gray-400 hover:text-jways-600 dark:hover:text-jways-400 transition-colors"
              aria-label={t('widget.manager.prev')}
            >
              <ChevronLeft className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
            </button>
            <span className="text-xs sm:text-[10px] text-gray-400 dark:text-gray-400 tabular-nums min-w-[28px] text-center">
              {currentIdx + 1} / {totalManagers}
            </span>
            <button
              onClick={goNext}
              className="p-2.5 sm:p-1 text-gray-400 hover:text-jways-600 dark:hover:text-jways-400 transition-colors"
              aria-label={t('widget.manager.next')}
            >
              <ChevronRight className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col items-center">
        {/* Profile Avatar */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full bg-jways-100 dark:bg-jways-800 flex items-center justify-center border-2 border-white dark:border-jways-700 shadow-sm overflow-hidden">
            <UserCircle className="w-12 h-12 text-jways-400 dark:text-jways-500" />
          </div>
          <div
            className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white dark:border-jways-800 rounded-full ${
              manager.available && isOffice
                ? 'bg-green-500'
                : manager.available
                  ? 'bg-yellow-400'
                  : 'bg-gray-400'
            }`}
            title={
              manager.available && isOffice
                ? 'Online'
                : manager.available
                  ? 'Away'
                  : 'Offline'
            }
          />
        </div>

        {/* Info */}
        <div className="text-center mb-1">
          <h4 className="text-base font-bold text-gray-900 dark:text-white">{displayName}</h4>
          <p className="text-xs text-jways-600 dark:text-jways-400 font-medium">
            {t(manager.role)}
          </p>
          <p className="text-xs sm:text-[10px] text-gray-400 dark:text-gray-400 mt-0.5">
            {t(manager.department)}
          </p>
        </div>

        {/* Working hours */}
        <div className="flex items-center gap-1.5 mb-4">
          <Clock className="w-4 h-4 sm:w-3 sm:h-3 text-gray-400 dark:text-gray-400" />
          <span className="text-xs sm:text-[10px] text-gray-400 dark:text-gray-400">
            {manager.workingHours}
          </span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              isOffice
                ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                : 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
            }`}
          >
            {isOffice ? t('widget.manager.status.online') : t('widget.manager.status.offline')}
          </span>
        </div>

        {/* Contact Details */}
        <div className="w-full space-y-2 mb-4 bg-white dark:bg-jways-900/50 p-3 rounded-xl border border-gray-50 dark:border-jways-700/30">
          {/* Office phone */}
          <ContactRow
            icon={<Phone className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-50 dark:bg-blue-900/20"
            value={manager.phone}
            href={`tel:${manager.phone.replace(/[^+\d]/g, '')}`}
            onCopy={() => handleCopy(manager.phone, 'phone')}
            copied={copiedField === 'phone'}
          />
          {/* Mobile */}
          <ContactRow
            icon={<Smartphone className="w-3 h-3 text-green-600 dark:text-green-400" />}
            iconBg="bg-green-50 dark:bg-green-900/20"
            value={manager.mobile}
            href={`tel:${manager.mobile.replace(/[^+\d]/g, '')}`}
            onCopy={() => handleCopy(manager.mobile, 'mobile')}
            copied={copiedField === 'mobile'}
          />
          {/* Email */}
          <ContactRow
            icon={<Mail className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-50 dark:bg-amber-900/20"
            value={manager.email}
            href={`mailto:${manager.email}`}
            onCopy={() => handleCopy(manager.email, 'email')}
            copied={copiedField === 'email'}
          />
        </div>

        {/* CTA */}
        <button className="w-full flex items-center justify-center py-2.5 px-4 bg-jways-600 hover:bg-jways-700 hover:shadow-md text-white rounded-xl text-sm font-bold transition-all duration-200">
          <MessageCircle className="w-4 h-4 mr-2" />
          {t('widget.manager.chat')}
        </button>
      </div>
    </div>
  );
};

/** Reusable contact row with copy button */
function ContactRow({
  icon,
  iconBg,
  value,
  href,
  onCopy,
  copied,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  href: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center text-sm group">
      <div
        className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center mr-3 shrink-0`}
      >
        {icon}
      </div>
      <a
        href={href}
        className="text-gray-600 dark:text-gray-300 hover:text-jways-600 dark:hover:text-jways-400 transition-colors font-medium truncate flex-1"
      >
        {value}
      </a>
      <button
        onClick={(e) => {
          e.preventDefault();
          onCopy();
        }}
        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2 p-2 sm:p-1 text-gray-400 hover:text-jways-500"
        aria-label={t('widget.manager.copy')}
      >
        {copied ? (
          <Check className="w-4 h-4 sm:w-3 sm:h-3 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 sm:w-3 sm:h-3" />
        )}
      </button>
    </div>
  );
}
