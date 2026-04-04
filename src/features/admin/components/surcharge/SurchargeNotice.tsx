import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const SurchargeNotice: React.FC = () => {
  return (
    <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <p>
          UPS/DHL은 할증료 API를 제공하지 않아 실시간 자동 반영이 불가합니다.
          공식 홈페이지의 변경사항을 확인 후 수동으로 업데이트해 주세요.
        </p>
      </div>
    </div>
  );
};
