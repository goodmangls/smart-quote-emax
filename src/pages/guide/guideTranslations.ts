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
  shortcutLabel: string;
  screenshotPlaceholder: string;
  sections: {
    gettingStarted: GuideSection;
    dashboard: GuideSection;
    quoteCalculator: GuideSection;
    savingQuotes: GuideSection;
    pdfExport: GuideSection;
    quoteHistory: GuideSection;
    accountSettings: GuideSection;
    adminOverview: GuideSection;
    marginRules: GuideSection;
    fscManagement: GuideSection;
    surchargeManagement: GuideSection;
    customerManagement: GuideSection;
    userManagement: GuideSection;
    rateTableViewer: GuideSection;
    auditLog: GuideSection;
  };
}

export const guideTranslations: Record<string, GuideTranslation> = {
  en: {
    pageTitle: 'User Guide',
    tocTitle: 'Table of Contents',
    adminBadge: 'Admin',
    memberBadge: 'Member',
    tipLabel: 'Tip',
    noteLabel: 'Note',
    shortcutLabel: 'Shortcut',
    screenshotPlaceholder: '[Screenshot: %s]',
    sections: {
      gettingStarted: {
        title: 'Getting Started',
        items: [
          {
            title: 'Creating an Account',
            description: 'Click "Sign Up" on the top-right corner. Fill in your email, password, company name, name, nationality, and optionally select your freight network memberships (WCA, MPL, EAN, JCtrans). Your account will be activated immediately after registration.',
          },
          {
            title: 'Logging In',
            description: 'Click "Login" and enter your registered email and password. The system remembers your language preference and theme setting across sessions.',
          },
          {
            title: 'Language & Theme',
            description: 'Use the globe icon to switch between English, Korean, Japanese, and Chinese. Use the moon/sun icon to toggle dark mode. These preferences are saved automatically.',
          },
        ],
      },
      dashboard: {
        title: 'Dashboard',
        items: [
          {
            title: 'Welcome Banner',
            description: 'Displays your name, role, and a quick action button to create a new quote.',
          },
          {
            title: 'Recent Quotes',
            description: 'Shows your most recent saved quotes with route, carrier, and total price at a glance. Click "View All" to access the full quote history.',
          },
          {
            title: 'Weather Widget',
            description: 'Real-time weather conditions across 47 global ports and airports. Weather disruptions can affect shipping schedules.',
            adminOnly: true,
          },
          {
            title: 'Exchange Rate Widget',
            description: 'Live exchange rates for USD, EUR, JPY, CNY, GBP, and SGD against KRW. Rates auto-refresh every 5 minutes.',
            adminOnly: true,
          },
          {
            title: 'Currency Calculator',
            description: 'Quick currency conversion tool on the sidebar. Select currencies and enter an amount to convert.',
            adminOnly: true,
          },
        ],
      },
      quoteCalculator: {
        title: 'Quote Calculator',
        items: [
          {
            title: '① Route & Delivery Terms',
            description: 'Select origin country, destination country, shipping zone, and delivery mode (Door-to-Door or Door-to-Airport). Enter the destination zip code for accurate pricing.',
          },
          {
            title: '② Cargo Details',
            description: 'Enter the number of boxes, dimensions (L x W x H in cm), and actual weight (kg). The system automatically calculates volumetric weight and applies packing adjustments (+10/+10/+15 cm).',
          },
          {
            title: '③ Additional Services',
            description: 'Configure Seoul pickup costs, review system-applied surcharges (AHS, large package, etc.), and add manual surcharges if needed. DHL now supports 6 additional add-ons including EMG, TSD, NSC, MWB, LBI, and LBM.',
          },
          {
            title: 'Special Packing Info',
            description: 'Selecting WOODEN_BOX, SKID, or VACUUM packing shows a detailed cost panel: material cost (surface area × ₩15,000/m²), labor (₩50,000/box, ₩75,000 vacuum), fumigation (₩30,000 fixed), and dimension/weight impact. AHS auto-detect warning is also shown.',
            adminOnly: true,
          },
          {
            title: 'UPS Surge Fee & EAS/RAS',
            description: 'For Middle East/Israel destinations, UPS Surge Fee (SGF) is auto-calculated. When entering a ZIP code, the system checks 86 countries and 39,876 postal ranges to detect Extended/Remote Area surcharges with one-click apply.',
          },
          {
            title: '④ Financial Settings',
            description: 'Review applied exchange rates and FSC percentages. The system uses live rates but allows admin overrides. Express shipments (UPS/DHL) use DAP incoterm only.',
            adminOnly: true,
          },
          {
            title: 'Results & Comparison',
            description: 'View side-by-side carrier comparison cards showing UPS and DHL rates. Each card breaks down origin costs, freight, destination charges, and final price.',
          },
        ],
      },
      savingQuotes: {
        title: 'Saving Quotes',
        items: [
          {
            title: 'Save Button',
            description: 'Click "Save Quote" after calculating. The system generates a unique reference number (SQ-YYYY-NNNN) for tracking.',
          },
          {
            title: 'Adding Notes',
            description: 'Add internal notes or customer-specific instructions when saving. These notes are visible in the quote detail view.',
          },
          {
            title: 'Slack Notification',
            description: 'When a member saves a quote, an automatic Slack notification is sent to the team channel. This helps admins track member activity in real-time.',
          },
          {
            title: 'Quote Validity',
            description: 'Saved quotes have a validity period with color-coded indicators: green (>3 days), yellow (1–3 days), red (expired). Surcharge changes may also flag a quote for re-verification.',
          },
        ],
      },
      pdfExport: {
        title: 'PDF Export',
        items: [
          {
            title: 'Generating PDF',
            description: 'Click "Download PDF" on any saved quote to generate a professional quote document. The PDF includes route details, cost breakdown, disclaimers in Korean and English, and the rate date.',
          },
          {
            title: 'PDF Contents',
            description: 'The generated PDF includes: company header, reference number, origin/destination, itemized cost breakdown, packing type with cost sub-breakdown (material, labor, fumigation), carrier add-on details (SGF, EXT, RMT, etc.), applied discount, final price in KRW and USD, and validity disclaimers.',
          },
        ],
      },
      quoteHistory: {
        title: 'Quote History',
        items: [
          {
            title: 'Searching Quotes',
            description: 'Use the search bar to find quotes by reference number, destination country, or notes. The search works across all text fields.',
          },
          {
            title: 'Filtering',
            description: 'Filter quotes by destination country, date range, or status (confirmed/expired). Combine filters with search for precise results.',
          },
          {
            title: 'Quote Detail View',
            description: 'Click on any quote row to open the detail modal. View full cost breakdown, applied discount rules, notes, and surcharge status.',
          },
          {
            title: 'CSV Export',
            description: 'Export your quote history as a CSV file for external analysis. The export includes all visible columns and supports up to 10,000 records.',
          },
        ],
      },
      accountSettings: {
        title: 'Account Settings',
        items: [
          {
            title: 'Changing Password',
            description: 'Click the gear icon in the header to open Account Settings. Enter your current password, then your new password (minimum 6 characters) and confirm it.',
          },
          {
            title: 'Theme Preference',
            description: 'Toggle between light and dark mode using the sun/moon icon in the header. Your preference is saved in the browser.',
          },
          {
            title: 'Language Preference',
            description: 'Click the globe icon to switch languages. The system supports English, Korean, Japanese, and Chinese. Your choice persists across sessions.',
          },
        ],
      },
      adminOverview: {
        title: 'Admin Panel Overview',
        items: [
          {
            title: 'Accessing Admin Panel',
            description: 'Admin users see an "Admin Panel" link in the header. The admin view provides the same quote calculator plus additional management widgets below.',
          },
          {
            title: 'Admin Widgets',
            description: 'The admin panel includes: Discount Rules, FSC Rates, Surcharge Management, Customer Management, User Management, Rate Table Viewer, and Audit Log.',
          },
          {
            title: 'Discount Visibility',
            description: 'Only admin users can see the discount breakdown and pricing strategy sections in the quote results. Members see final prices only.',
          },
        ],
      },
      marginRules: {
        title: 'Discount Rules Management',
        items: [
          {
            title: 'Priority System',
            description: 'Discount rules follow a priority-based resolution: P100 (per-user flat rate, highest priority) > P90 (per-user weight-based) > P50 (nationality-based) > P0 (default fallback). The first matching rule wins.',
          },
          {
            title: 'Creating Rules',
            description: 'Click "Add Rule" to create a new discount rule. Specify the priority tier, target (user email or nationality), discount percentage, and optional weight range for P90 rules.',
          },
          {
            title: 'Editing & Deleting',
            description: 'Click the edit icon to modify existing rules inline. Delete uses soft-delete to preserve audit history. All changes are logged in the Audit Log.',
          },
          {
            title: 'Rule Resolution',
            description: 'Use the "Test Resolve" feature to see which discount rule would apply for a specific user and weight combination. Results are cached for 5 minutes.',
          },
        ],
      },
      fscManagement: {
        title: 'FSC Rate Management',
        items: [
          {
            title: 'Viewing Current Rates',
            description: 'The FSC widget displays current fuel surcharge percentages for DHL and UPS, both international and domestic. Each rate shows its last update date.',
          },
          {
            title: 'Updating Rates',
            description: 'Enter new FSC percentages and save. Changes take effect immediately for all new calculations. External verification links are provided for cross-checking with official carrier pages.',
          },
          {
            title: 'Rate Impact',
            description: 'FSC is applied as a percentage on top of the base carrier freight rate. A change in FSC directly affects all quote calculations.',
          },
        ],
      },
      surchargeManagement: {
        title: 'Surcharge Management',
        items: [
          {
            title: 'Active Surcharges',
            description: 'View all currently active surcharges in a table format. Each entry shows the surcharge name, carrier, type (percentage or flat), amount, and effective dates.',
          },
          {
            title: 'Adding Surcharges',
            description: 'Use the form to add carrier-specific surcharges. Specify the carrier, surcharge name, type (percentage or flat amount), value, and optional start/end dates.',
          },
          {
            title: 'Carrier Links',
            description: 'Quick links to official UPS and DHL surcharge announcement pages for verification.',
          },
          {
            title: 'Important Notice',
            description: 'Surcharges are manually updated based on official carrier announcements. They are not auto-synced. Always verify with official pages before finalizing quotes.',
          },
        ],
      },
      customerManagement: {
        title: 'Customer Management',
        items: [
          {
            title: 'Customer List',
            description: 'View all registered customers with their company name, contact information, and quote count badges showing activity level.',
          },
          {
            title: 'Adding Customers',
            description: 'Create customer records with company name, contact person, email, and phone number. Customer records can be linked to saved quotes.',
          },
          {
            title: 'Customer Quotes',
            description: 'View all quotes associated with a specific customer. This helps track customer activity and pricing history.',
          },
        ],
      },
      userManagement: {
        title: 'User Management',
        items: [
          {
            title: 'User List',
            description: 'View all registered users with their name, email, company, nationality, network memberships, and role (admin/member).',
          },
          {
            title: 'Editing Users',
            description: 'Click "Edit" to modify user details including role, company, nationality, and network memberships. Changes are saved immediately and logged.',
          },
          {
            title: 'Search & Filter',
            description: 'Use the search bar to find users by name, email, or company name.',
          },
        ],
      },
      rateTableViewer: {
        title: 'Rate Table Viewer',
        items: [
          {
            title: 'Viewing Rate Tables',
            description: 'Browse carrier-specific rate tables (UPS, DHL) in a read-only format. Tables show weight-based pricing across all shipping zones.',
          },
          {
            title: 'Zone Reference',
            description: 'Each carrier has its own zone mapping. The viewer shows which countries belong to each zone for reference during quoting.',
          },
        ],
      },
      auditLog: {
        title: 'Audit Log',
        items: [
          {
            title: 'Viewing Audit Logs',
            description: 'All admin actions (discount rule changes, FSC updates, surcharge modifications, user edits) are recorded with timestamp, user, action type, and details.',
          },
          {
            title: 'Search & Filter',
            description: 'Filter audit logs by date range, action type, or user. Use the search bar to find specific entries.',
          },
          {
            title: 'Compliance',
            description: 'The audit log provides a complete trail of all configuration changes for compliance and accountability purposes.',
          },
        ],
      },
    },
  },

  ko: {
    pageTitle: '사용자 가이드',
    tocTitle: '목차',
    adminBadge: '관리자',
    memberBadge: '회원',
    tipLabel: '팁',
    noteLabel: '참고',
    shortcutLabel: '단축키',
    screenshotPlaceholder: '[스크린샷: %s]',
    sections: {
      gettingStarted: {
        title: '시작하기',
        items: [
          {
            title: '계정 만들기',
            description: '우측 상단의 "회원가입"을 클릭하세요. 이메일, 비밀번호, 회사명, 이름, 국적을 입력하고, 선택적으로 물류 네트워크 가입 여부(WCA, MPL, EAN, JCtrans)를 선택합니다. 등록 후 즉시 계정이 활성화됩니다.',
          },
          {
            title: '로그인',
            description: '"로그인"을 클릭하고 등록된 이메일과 비밀번호를 입력하세요. 시스템은 세션 간 언어 설정과 테마 설정을 기억합니다.',
          },
          {
            title: '언어 및 테마',
            description: '지구본 아이콘으로 영어, 한국어, 일본어, 중국어 간 전환할 수 있습니다. 달/해 아이콘으로 다크 모드를 토글합니다. 이 설정은 자동으로 저장됩니다.',
          },
        ],
      },
      dashboard: {
        title: '대시보드',
        items: [
          {
            title: '환영 배너',
            description: '이름, 역할, 그리고 새 견적을 만들 수 있는 빠른 액션 버튼이 표시됩니다.',
          },
          {
            title: '최근 견적',
            description: '최근 저장된 견적의 경로, 운송사, 총 가격을 한눈에 보여줍니다. "전체 보기"를 클릭하면 전체 견적 내역에 접근할 수 있습니다.',
          },
          {
            title: '날씨 위젯',
            description: '전 세계 47개 주요 항구 및 공항의 실시간 기상 상황을 제공합니다. 기상 이변은 배송 일정에 영향을 줄 수 있습니다.',
            adminOnly: true,
          },
          {
            title: '환율 위젯',
            description: 'USD, EUR, JPY, CNY, GBP, SGD의 KRW 대비 실시간 환율을 표시합니다. 5분마다 자동 갱신됩니다.',
            adminOnly: true,
          },
          {
            title: '환율 계산기',
            description: '사이드바의 빠른 환율 변환 도구입니다. 통화를 선택하고 금액을 입력하면 바로 변환됩니다.',
            adminOnly: true,
          },
        ],
      },
      quoteCalculator: {
        title: '견적 계산기',
        items: [
          {
            title: '① 경로 및 배송 조건',
            description: '출발국, 도착국, 배송 존, 배송 모드(Door-to-Door 또는 Door-to-Airport)를 선택합니다. 정확한 가격 산출을 위해 도착지 우편번호를 입력하세요.',
          },
          {
            title: '② 화물 상세',
            description: '박스 수, 치수(L x W x H, cm), 실중량(kg)을 입력합니다. 시스템이 자동으로 부피중량을 계산하고 포장 조정값(+10/+10/+15cm)을 적용합니다.',
          },
          {
            title: '③ 부가 서비스',
            description: '서울 픽업 비용을 설정하고, 시스템 적용 할증료(AHS, 대형 화물 등)를 확인하며, 필요 시 수동 할증료를 추가할 수 있습니다. DHL은 EMG, TSD, NSC, MWB, LBI, LBM 등 6개 부가서비스가 추가되었습니다.',
          },
          {
            title: '특수 포장 정보',
            description: 'WOODEN_BOX, SKID, VACUUM 포장 선택 시 상세 비용 패널이 표시됩니다: 재료비(표면적 × ₩15,000/m²), 인건비(₩50,000/박스, 진공 ₩75,000), 훈증비(₩30,000 고정), 치수/중량 영향. AHS 자동 감지 경고도 표시됩니다.',
            adminOnly: true,
          },
          {
            title: 'UPS Surge Fee & EAS/RAS',
            description: '중동/이스라엘 도착지의 경우 UPS Surge Fee(SGF)가 자동 계산됩니다. 우편번호 입력 시 86개국 39,876개 우편번호 범위를 자동으로 확인하여 원격지/확장 지역 할증료를 감지하고 원클릭 적용할 수 있습니다.',
          },
          {
            title: '④ 재무 설정',
            description: '적용된 환율과 FSC 비율을 확인합니다. 시스템은 실시간 환율을 사용하지만 관리자 수동 설정도 가능합니다. 특송(UPS/DHL)은 DAP 인코텀만 적용됩니다.',
            adminOnly: true,
          },
          {
            title: '결과 및 비교',
            description: 'UPS, DHL 요율을 나란히 비교하는 카드를 확인하세요. 각 카드에는 출발지 비용, 운임, 도착지 비용, 최종 가격이 표시됩니다.',
          },
        ],
      },
      savingQuotes: {
        title: '견적 저장',
        items: [
          {
            title: '저장 버튼',
            description: '계산 후 "견적 저장"을 클릭합니다. 시스템이 추적용 고유 참조번호(SQ-YYYY-NNNN)를 생성합니다.',
          },
          {
            title: '메모 추가',
            description: '저장 시 내부 메모나 고객별 지시사항을 추가할 수 있습니다. 이 메모는 견적 상세 보기에서 확인 가능합니다.',
          },
          {
            title: 'Slack 알림',
            description: '회원이 견적을 저장하면 팀 채널에 자동으로 Slack 알림이 전송됩니다. 이를 통해 관리자가 회원 활동을 실시간으로 추적할 수 있습니다.',
          },
          {
            title: '견적 유효기간',
            description: '저장된 견적에는 유효기간이 있으며 색상 코드로 표시됩니다: 초록색(3일 이상), 노란색(1~3일), 빨간색(만료). 할증료 변경 시에도 재확인 필요 플래그가 표시될 수 있습니다.',
          },
        ],
      },
      pdfExport: {
        title: 'PDF 내보내기',
        items: [
          {
            title: 'PDF 생성',
            description: '저장된 견적에서 "PDF 다운로드"를 클릭하면 전문적인 견적서가 생성됩니다. PDF에는 경로 상세, 비용 내역, 한국어/영어 면책조항, 기준일이 포함됩니다.',
          },
          {
            title: 'PDF 내용',
            description: '생성된 PDF에는 회사 헤더, 참조번호, 출발지/도착지, 항목별 비용 내역, 포장 유형 및 세부 비용(재료비, 인건비, 훈증비), 운송사 부가서비스 내역(SGF, EXT, RMT 등), 적용 할인, KRW 및 USD 최종 가격, 유효기간 면책조항이 포함됩니다.',
          },
        ],
      },
      quoteHistory: {
        title: '견적 내역',
        items: [
          {
            title: '견적 검색',
            description: '검색창을 사용하여 참조번호, 도착국, 메모로 견적을 찾을 수 있습니다. 모든 텍스트 필드에서 검색이 작동합니다.',
          },
          {
            title: '필터링',
            description: '도착국, 기간, 상태(확정/만료)로 견적을 필터링합니다. 검색과 필터를 결합하면 정확한 결과를 얻을 수 있습니다.',
          },
          {
            title: '견적 상세 보기',
            description: '견적 행을 클릭하면 상세 모달이 열립니다. 전체 비용 내역, 적용된 할인 규칙, 메모, 할증료 상태를 확인할 수 있습니다.',
          },
          {
            title: 'CSV 내보내기',
            description: '외부 분석을 위해 견적 내역을 CSV 파일로 내보낼 수 있습니다. 표시된 모든 열이 포함되며 최대 10,000건까지 지원합니다.',
          },
        ],
      },
      accountSettings: {
        title: '계정 설정',
        items: [
          {
            title: '비밀번호 변경',
            description: '헤더의 톱니바퀴 아이콘을 클릭하여 계정 설정을 엽니다. 현재 비밀번호를 입력한 후 새 비밀번호(최소 6자)를 입력하고 확인합니다.',
          },
          {
            title: '테마 설정',
            description: '헤더의 해/달 아이콘으로 라이트/다크 모드를 전환합니다. 설정은 브라우저에 저장됩니다.',
          },
          {
            title: '언어 설정',
            description: '지구본 아이콘을 클릭하여 언어를 전환합니다. 영어, 한국어, 일본어, 중국어를 지원합니다. 선택한 언어는 세션 간 유지됩니다.',
          },
        ],
      },
      adminOverview: {
        title: '관리자 패널 개요',
        items: [
          {
            title: '관리자 패널 접근',
            description: '관리자는 헤더에 "관리자 패널" 링크가 표시됩니다. 관리자 뷰에서는 동일한 견적 계산기에 추가 관리 위젯이 아래에 표시됩니다.',
          },
          {
            title: '관리자 위젯',
            description: '관리자 패널에는 할인 규칙, FSC 요율, 할증료 관리, 고객 관리, 사용자 관리, 요율표 뷰어, 감사 로그가 포함됩니다.',
          },
          {
            title: '할인 표시',
            description: '관리자만 견적 결과에서 할인 내역과 가격 전략 섹션을 볼 수 있습니다. 회원은 최종 가격만 볼 수 있습니다.',
          },
        ],
      },
      marginRules: {
        title: '할인 규칙 관리',
        items: [
          {
            title: '우선순위 시스템',
            description: '할인 규칙은 우선순위 기반으로 적용됩니다: P100(사용자별 고정 요율, 최고 우선순위) > P90(사용자별 중량 기반) > P50(국적 기반) > P0(기본값). 첫 번째 일치 규칙이 적용됩니다.',
          },
          {
            title: '규칙 생성',
            description: '"규칙 추가"를 클릭하여 새 할인 규칙을 생성합니다. 우선순위 등급, 대상(사용자 이메일 또는 국적), 할인 비율, P90 규칙의 선택적 중량 범위를 지정합니다.',
          },
          {
            title: '수정 및 삭제',
            description: '수정 아이콘을 클릭하여 기존 규칙을 인라인으로 수정합니다. 삭제는 감사 이력 보존을 위해 소프트 삭제를 사용합니다. 모든 변경사항은 감사 로그에 기록됩니다.',
          },
          {
            title: '규칙 해석',
            description: '"테스트 해석" 기능을 사용하여 특정 사용자와 중량 조합에 어떤 할인 규칙이 적용되는지 확인할 수 있습니다. 결과는 5분간 캐시됩니다.',
          },
        ],
      },
      fscManagement: {
        title: 'FSC 요율 관리',
        items: [
          {
            title: '현재 요율 확인',
            description: 'FSC 위젯은 DHL과 UPS의 현재 유류할증료 비율(국제/국내)을 표시합니다. 각 요율의 마지막 업데이트 날짜가 함께 표시됩니다.',
          },
          {
            title: '요율 업데이트',
            description: '새로운 FSC 비율을 입력하고 저장합니다. 변경사항은 즉시 모든 새로운 계산에 적용됩니다. 공식 운송사 페이지와 교차 확인을 위한 외부 링크가 제공됩니다.',
          },
          {
            title: '요율 영향',
            description: 'FSC는 기본 운송사 운임에 백분율로 적용됩니다. FSC 변경은 모든 견적 계산에 직접 영향을 미칩니다.',
          },
        ],
      },
      surchargeManagement: {
        title: '할증료 관리',
        items: [
          {
            title: '활성 할증료',
            description: '현재 활성화된 모든 할증료를 테이블 형식으로 확인합니다. 각 항목은 할증료명, 운송사, 유형(비율 또는 정액), 금액, 유효기간을 표시합니다.',
          },
          {
            title: '할증료 추가',
            description: '양식을 사용하여 운송사별 할증료를 추가합니다. 운송사, 할증료명, 유형(비율 또는 정액), 값, 선택적 시작/종료일을 지정합니다.',
          },
          {
            title: '운송사 링크',
            description: 'UPS와 DHL 공식 할증료 공지 페이지로의 빠른 링크를 제공합니다.',
          },
          {
            title: '중요 안내',
            description: '할증료는 공식 운송사 공지를 기반으로 수동 업데이트됩니다. 자동 동기화되지 않으므로 견적 확정 전 반드시 공식 페이지에서 확인하세요.',
          },
        ],
      },
      customerManagement: {
        title: '고객 관리',
        items: [
          {
            title: '고객 목록',
            description: '등록된 모든 고객의 회사명, 연락처, 활동 수준을 나타내는 견적 수 배지를 확인합니다.',
          },
          {
            title: '고객 추가',
            description: '회사명, 담당자, 이메일, 전화번호로 고객 기록을 생성합니다. 고객 기록은 저장된 견적에 연결할 수 있습니다.',
          },
          {
            title: '고객별 견적',
            description: '특정 고객과 연결된 모든 견적을 확인합니다. 고객 활동과 가격 이력을 추적하는 데 도움이 됩니다.',
          },
        ],
      },
      userManagement: {
        title: '사용자 관리',
        items: [
          {
            title: '사용자 목록',
            description: '등록된 모든 사용자의 이름, 이메일, 회사, 국적, 네트워크 가입 여부, 역할(관리자/회원)을 확인합니다.',
          },
          {
            title: '사용자 수정',
            description: '"수정"을 클릭하여 역할, 회사, 국적, 네트워크 가입 여부를 포함한 사용자 세부정보를 수정합니다. 변경사항은 즉시 저장되고 기록됩니다.',
          },
          {
            title: '검색 및 필터',
            description: '검색창을 사용하여 이름, 이메일, 회사명으로 사용자를 찾습니다.',
          },
        ],
      },
      rateTableViewer: {
        title: '요율표 뷰어',
        items: [
          {
            title: '요율표 보기',
            description: '운송사별 요율표(UPS, DHL)를 읽기 전용으로 탐색합니다. 모든 배송 존에 대한 중량별 가격이 표시됩니다.',
          },
          {
            title: '존 참조',
            description: '각 운송사는 고유한 존 매핑을 가지고 있습니다. 뷰어에서 견적 작성 시 참고용으로 각 존에 속하는 국가를 확인할 수 있습니다.',
          },
        ],
      },
      auditLog: {
        title: '감사 로그',
        items: [
          {
            title: '감사 로그 보기',
            description: '모든 관리자 작업(할인 규칙 변경, FSC 업데이트, 할증료 수정, 사용자 편집)이 타임스탬프, 사용자, 작업 유형, 세부사항과 함께 기록됩니다.',
          },
          {
            title: '검색 및 필터',
            description: '기간, 작업 유형, 사용자별로 감사 로그를 필터링합니다. 검색창으로 특정 항목을 찾습니다.',
          },
          {
            title: '컴플라이언스',
            description: '감사 로그는 컴플라이언스와 책임 추적을 위해 모든 설정 변경의 완전한 기록을 제공합니다.',
          },
        ],
      },
    },
  },

};
