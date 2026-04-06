export interface GuideItem {
  title: string;
  description: string;
  adminOnly?: boolean;
}

export interface GuideSection {
  title: string;
  items: GuideItem[];
}

export interface GuideTranslation {
  pageTitle: string;
  tocTitle: string;
  adminBadge: string;
  memberBadge: string;
  tipLabel: string;
  noteLabel: string;
  sections: {
    setup: GuideSection;
    calculator: GuideSection;
    systemSettings: GuideSection;
    userOperations: GuideSection;
    auditLog: GuideSection;
  };
}

export const guideTranslations: Record<string, GuideTranslation> = {
  en: {
    pageTitle: 'User Guide',
    tocTitle: 'Contents',
    adminBadge: 'Admin',
    memberBadge: 'Member',
    tipLabel: 'Tip',
    noteLabel: 'Note',
    sections: {
      setup: {
        title: '1. Getting Started',
        items: [
          {
            title: 'Account & Login',
            description: 'Sign up with your email and log in to access the Smart Quote system. Your theme and language preferences are saved automatically.',
          },
          {
            title: 'Account Settings',
            description: 'Click the gear icon in the header to change your password or update your profile details.',
          },
        ],
      },
      calculator: {
        title: '2. Quote & PDF',
        items: [
          {
            title: 'Smart Calculator',
            description: 'Enter route, cargo dimensions, and weight. The system auto-calculates volumetric weight and applies standard surcharges (AHS, etc.).',
          },
          {
            title: 'PDF Export',
            description: 'Download professional quote documents in both Korean and English with a single click. Rates are valid for the specified period.',
          },
        ],
      },
      systemSettings: {
        title: '3. System Settings',
        items: [
          {
            title: 'Discount Rules',
            description: 'Manage priority-based discount rules (P100 to P0) for specific users or nationalities.',
            adminOnly: true,
          },
          {
            title: 'FSC & Surcharges',
            description: 'Update fuel surcharges (FSC) and carrier surcharges based on official UPS/DHL announcements.',
            adminOnly: true,
          },
        ],
      },
      userOperations: {
        title: '4. Operations',
        items: [
          {
            title: 'User & Customer Management',
            description: 'Manage internal users and customer company records. Link saved quotes to specific customers.',
            adminOnly: true,
          },
          {
            title: 'Rate Table Viewer',
            description: 'Browse weight-based published rate tables and zone mapping for all supported carriers.',
            adminOnly: true,
          },
        ],
      },
      auditLog: {
        title: '5. Audit & Compliance',
        items: [
          {
            title: 'Action Tracking',
            description: 'Every configuration change is recorded with a timestamp and user details for compliance and accountability.',
            adminOnly: true,
          },
        ],
      },
    },
  },
  ko: {
    pageTitle: '사용자 가이드',
    tocTitle: '목차',
    adminBadge: '관리자',
    memberBadge: '구성원',
    tipLabel: '팁',
    noteLabel: '참고',
    sections: {
      setup: {
        title: '1. 시작하기',
        items: [
          {
            title: '계정 및 로그인',
            description: '이메일로 가입하고 로그인하여 스마트 견적 시스템에 접속하세요. 테마와 언어 설정은 자동으로 저장됩니다.',
          },
          {
            title: '계정 설정',
            description: '상단 헤더의 톱니바퀴 아이콘을 클릭하여 비밀번호를 변경하거나 프로필 정보를 업데이트할 수 있습니다.',
          },
        ],
      },
      calculator: {
        title: '2. 견적 및 PDF',
        items: [
          {
            title: '스마트 계산기',
            description: '경로, 화물 치수 및 중량을 입력하세요. 부피중량이 자동 계산되며 표준 할증료(AHS 등)가 즉시 적용됩니다.',
          },
          {
            title: 'PDF 내보내기',
            description: '한 번의 클릭으로 국문/영문 전문 견적서를 다운로드할 수 있습니다. 견적은 명시된 유효기간 동안 유효합니다.',
          },
        ],
      },
      systemSettings: {
        title: '3. 시스템 설정',
        items: [
          {
            title: '할인 규칙 관리',
            description: '특정 사용자나 국적에 대해 우선순위 기반(P100~P0) 할인 규칙을 설정하고 관리합니다.',
            adminOnly: true,
          },
          {
            title: '유류할증료 및 할증료',
            description: 'UPS/DHL 공식 공지를 바탕으로 유류할증료(FSC)와 기타 할증료를 최신 상태로 유지합니다.',
            adminOnly: true,
          },
        ],
      },
      userOperations: {
        title: '4. 운영 관리',
        items: [
          {
            title: '사용자 및 고객 관리',
            description: '내부 사용자 계정과 고객사 정보를 관리합니다. 저장된 견적은 특정 고객과 연결하여 추적할 수 있습니다.',
            adminOnly: true,
          },
          {
            title: '요율표 확인',
            description: '지원하는 운송사별 중량 및 존(Zone) 기반 공고 요율표를 열람할 수 있습니다.',
            adminOnly: true,
          },
        ],
      },
      auditLog: {
        title: '5. 감사 및 기록',
        items: [
          {
            title: '작업 이력 추적',
            description: '모든 설정 변경 사항은 타임스탬프 및 작업자 정보와 함께 기록되어 투명한 운영을 지원합니다.',
            adminOnly: true,
          },
        ],
      },
    },
  },
};
