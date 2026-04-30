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
    cargo: GuideSection;
    financial: GuideSection;
    comparison: GuideSection;
    costBreakdown: GuideSection;
    history: GuideSection;
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
            description:
              'Sign up with your email and log in to access the Smart Quote system. Your theme and language preferences are saved automatically.',
          },
          {
            title: 'Account Settings',
            description:
              'Click the gear icon in the header to change your password or update your profile details.',
          },
          {
            title: 'Navigation',
            description:
              'Use the top menu to switch between Calculator, History, and Dashboard. On mobile, swipe or use the bottom navigation bar.',
          },
        ],
      },
      cargo: {
        title: '2. Cargo & Shipping Setup',
        items: [
          {
            title: 'Origin & Destination',
            description:
              'Select origin (default: Korea) and destination country. The system automatically determines the carrier zone (e.g., UPS Z5 for US, DHL Z6 for Europe) based on your destination.',
          },
          {
            title: 'Cargo Dimensions & Weight',
            description:
              'Enter the length, width, height (cm), and actual weight (kg) for each item. You can add multiple items using the "+ Add Item" button. The system calculates volumetric weight automatically (L×W×H÷5000 for UPS/DHL, ÷6000 for EMAX).',
          },
          {
            title: 'Billable Weight',
            description:
              'The higher of actual weight vs. volumetric weight is used as the billable weight. This is the industry standard — carriers charge based on whichever is greater.',
          },
          {
            title: 'Packing Type',
            description:
              'Choose from None, Standard Box, Wooden Crate, or Fumigated Crate. Each option adds packing material cost, labor cost, and dimensional buffer (+10cm width, +10cm length, +15cm height) to account for packaging.',
          },
          {
            title: 'Carrier Selection',
            description:
              'Choose between UPS, DHL, FedEx, EMAX, or OCS. The system auto-suggests the most cost-effective carrier when you change destinations. You can override this manually at any time. (OCS services TW/HK/SG/CN/JP only.)',
          },
          {
            title: 'Incoterm',
            description:
              'Select the trade term (DAP, DDP, EXW, FOB). DAP is the default for express shipments. DDP includes duty/tax estimates. EXW/FOB will show a collect-term warning.',
          },
        ],
      },
      financial: {
        title: '3. Financial Settings & Discount',
        items: [
          {
            title: 'Exchange Rate (KRW/USD)',
            description:
              'Shows the current KRW-to-USD exchange rate. Default is based on Hana Bank Monday 09:00 remittance rate. This rate is updated manually every Monday and affects USD conversion display.',
          },
          {
            title: 'FSC % (Fuel Surcharge)',
            description:
              'Fuel Surcharge percentage applied to the base freight rate. Each carrier (UPS, DHL, FedEx) has different FSC rates updated monthly. Use the "LIVE" links next to the FSC field to check the latest official rates from each carrier website.',
          },
          {
            title: 'Discount (%)',
            description:
              'Discount percentage applied to the published tariff (list price). Default is 0% (full tariff price). Enter a discount rate to reduce the base freight — for example, 20% discount on a ₩100,000 tariff results in ₩80,000 base rate. FSC is then calculated on the discounted base.',
          },
          {
            title: 'How Discount is Calculated',
            description:
              'The calculation flow is: Published Tariff → Apply Discount % → Discounted Base Rate → Add FSC (on discounted base) → Add Surcharges & Add-ons → Final Quote (rounded up to nearest ₩100). The discount only applies to the base freight, not to add-ons or surcharges.',
          },
          {
            title: 'High Discount Warning',
            description:
              'If you enter a discount of 65% or higher, a warning will appear. This is to prevent accidental over-discounting. The maximum allowed discount is 80%.',
          },
        ],
      },
      comparison: {
        title: '4. Carrier Comparison',
        items: [
          {
            title: 'Comparison Card',
            description:
              'Below the main quote result, the Carrier Comparison card shows quotes for all available carriers (UPS, DHL, FedEx, EMAX, OCS) side by side. The cheapest option is highlighted with a green badge.',
          },
          {
            title: 'Price Difference',
            description:
              'Each carrier row shows the total quote amount and the price difference (+ or -) compared to your currently selected carrier, both in KRW and as a percentage.',
          },
          {
            title: 'One-Click Switch',
            description:
              "Click any carrier row in the comparison card to instantly switch your quote to that carrier. The main calculator updates immediately with the new carrier's rates, zone, and transit time.",
          },
          {
            title: 'Transit Time',
            description:
              'Each carrier shows estimated transit time (e.g., "1-3 days" for UPS Express Saver). Use this alongside price to make the best decision for your shipment urgency.',
          },
        ],
      },
      costBreakdown: {
        title: '5. Cost Breakdown Details',
        items: [
          {
            title: 'Viewing the Breakdown',
            description:
              'The Cost Breakdown card appears below the quote summary. It lists every component of your quote: Base Rate (tariff), Discount Amount, FSC, Packing Costs, Surcharges, Carrier Add-ons, and the Final Total.',
          },
          {
            title: 'Base Rate (International Freight)',
            description:
              "This is the carrier's published tariff rate based on the billable weight and destination zone. It represents the full list price before any discount is applied.",
          },
          {
            title: 'Discount Amount',
            description:
              'Shows the KRW amount deducted from the base rate. For example, with a 20% discount on ₩200,000 base rate, the discount amount shows ₩40,000.',
          },
          {
            title: 'Fuel Surcharge (FSC)',
            description:
              'FSC is calculated as a percentage of the discounted base rate (not the original tariff). If your discounted base is ₩160,000 and FSC is 39%, the FSC amount is ₩62,400.',
          },
          {
            title: 'Packing Costs',
            description:
              'Includes material cost and labor cost if a packing type is selected. Fumigation fee is added separately for fumigated crate option. These are shown as individual line items.',
          },
          {
            title: 'Surcharges & Add-ons',
            description:
              'Carrier-specific surcharges (AHS, OWT, DAS, EAS, Surge Fee, etc.) are listed individually. UPS Surge Fee for Israel/Middle East destinations is auto-detected and applied. DHL add-ons like OSP (Oversize Piece) are auto-calculated based on cargo dimensions.',
          },
          {
            title: 'Seoul Pickup Cost',
            description:
              'If Seoul pickup is selected, the pickup zone and cost appear as a separate line item. Zones are divided by Seoul district with fixed KRW pricing.',
          },
          {
            title: 'Key Metrics',
            description:
              'Above the breakdown, the Key Metrics row shows: Billable Weight, Applied Zone, Discount %, and Transit Time at a glance for quick reference.',
          },
        ],
      },
      history: {
        title: '6. PDF Export',
        items: [
          {
            title: 'PDF Export',
            description:
              'Download a professional PDF quote document. The PDF includes shipment details, cargo manifest, cost breakdown with all line items, and the total quote amount in KRW. Use this for customer communication or internal records.',
          },
          {
            title: 'Carrier Comparison PDF',
            description:
              'Export a multi-carrier comparison PDF that shows all carrier quotes side by side in a single document — useful for presenting options to decision makers.',
          },
        ],
      },
      systemSettings: {
        title: '7. System Settings',
        items: [
          {
            title: 'Discount Rules',
            description:
              'Manage priority-based discount rules (P100 to P0) for specific users or nationalities.',
            adminOnly: true,
          },
          {
            title: 'FSC & Surcharges',
            description:
              'Update fuel surcharges (FSC) and carrier surcharges based on official UPS/DHL announcements.',
            adminOnly: true,
          },
        ],
      },
      userOperations: {
        title: '8. Operations',
        items: [
          {
            title: 'User & Customer Management',
            description:
              'Manage internal users and customer company records. Link saved quotes to specific customers.',
            adminOnly: true,
          },
          {
            title: 'Rate Table Viewer',
            description:
              'Browse weight-based published rate tables and zone mapping for all supported carriers.',
            adminOnly: true,
          },
        ],
      },
      auditLog: {
        title: '9. Audit & Compliance',
        items: [
          {
            title: 'Action Tracking',
            description:
              'Every configuration change is recorded with a timestamp and user details for compliance and accountability.',
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
            description:
              '이메일로 가입하고 로그인하여 스마트 견적 시스템에 접속하세요. 테마와 언어 설정은 자동으로 저장됩니다.',
          },
          {
            title: '계정 설정',
            description:
              '상단 헤더의 톱니바퀴 아이콘을 클릭하여 비밀번호를 변경하거나 프로필 정보를 업데이트할 수 있습니다.',
          },
          {
            title: '화면 구성',
            description:
              '상단 메뉴에서 계산기, 히스토리, 대시보드를 전환할 수 있습니다. 모바일에서는 하단 네비게이션 바를 사용하세요.',
          },
        ],
      },
      cargo: {
        title: '2. 화물 및 배송 설정',
        items: [
          {
            title: '출발지 및 도착지',
            description:
              '출발지(기본: 한국)와 도착 국가를 선택합니다. 시스템이 도착지에 따라 캐리어 존(Zone)을 자동으로 결정합니다. 예: 미국은 UPS Z5, 유럽은 DHL Z6 등.',
          },
          {
            title: '화물 치수 및 중량',
            description:
              '각 아이템의 가로, 세로, 높이(cm)와 실중량(kg)을 입력합니다. "+ 아이템 추가" 버튼으로 여러 아이템을 등록할 수 있습니다. 부피중량은 자동 계산됩니다 (가로×세로×높이÷5000, EMAX는 ÷6000).',
          },
          {
            title: '적용 중량 (Billable Weight)',
            description:
              '실중량과 부피중량 중 큰 값이 적용 중량으로 사용됩니다. 이는 국제 특송 업계 표준으로, 모든 캐리어가 동일한 방식을 적용합니다.',
          },
          {
            title: '포장 유형',
            description:
              '없음, 일반 박스, 나무 크레이트, 훈증 크레이트 중 선택할 수 있습니다. 포장 선택 시 포장재 비용, 인건비, 치수 버퍼(+10cm 가로, +10cm 세로, +15cm 높이)가 자동 추가됩니다.',
          },
          {
            title: '캐리어 선택',
            description:
              'UPS, DHL, FedEx, EMAX, OCS 중 선택합니다. 도착지 변경 시 가장 경제적인 캐리어를 자동 추천하며, 언제든 수동으로 변경할 수 있습니다. (OCS는 TW/HK/SG/CN/JP만 서비스합니다.)',
          },
          {
            title: '인코텀 (Incoterm)',
            description:
              '무역 조건을 선택합니다 (DAP, DDP, EXW, FOB). 특송 기본값은 DAP입니다. DDP 선택 시 관세/세금 예상 금액을 입력할 수 있고, EXW/FOB 선택 시 착불 조건 안내가 표시됩니다.',
          },
        ],
      },
      financial: {
        title: '3. 재무 항목 및 할인 적용',
        items: [
          {
            title: '환율 (KRW/USD)',
            description:
              '현재 원/달러 환율을 표시합니다. 기본값은 하나은행 월요일 09시 송금환율 기준이며, 매주 월요일 수동으로 업데이트됩니다. USD 환산 표시에 사용됩니다.',
          },
          {
            title: 'FSC % (유류할증료)',
            description:
              '기본 운임에 적용되는 유류할증료 비율입니다. UPS, DHL, FedEx 각 캐리어마다 다른 FSC 비율이 매월 변경됩니다. FSC 입력란 옆의 "LIVE" 링크를 클릭하면 각 캐리어 공식 사이트에서 최신 FSC를 직접 확인할 수 있습니다.',
          },
          {
            title: '할인율 (%)',
            description:
              '캐리어 정가(Published Tariff)에 적용되는 할인율입니다. 기본값은 0% (정가 그대로)입니다. 예를 들어, 정가 ₩100,000에 할인율 20%를 적용하면 기본 운임이 ₩80,000이 됩니다. FSC는 할인 적용 후의 운임에 대해 계산됩니다.',
          },
          {
            title: '할인 적용 계산 방식',
            description:
              '계산 흐름: 캐리어 정가 → 할인율 적용 → 할인된 기본 운임 → FSC 추가 (할인 후 운임 기준) → 할증료 및 부가 비용 추가 → 최종 견적 (₩100 단위 올림). 할인은 기본 운임에만 적용되며, 부가 비용이나 할증료에는 적용되지 않습니다.',
          },
          {
            title: '과다 할인 경고',
            description:
              '할인율 65% 이상 입력 시 경고 메시지가 표시됩니다. 실수로 인한 과도한 할인을 방지하기 위한 안전장치이며, 최대 허용 할인율은 80%입니다.',
          },
        ],
      },
      comparison: {
        title: '4. 캐리어 비교',
        items: [
          {
            title: '비교 카드',
            description:
              '견적 결과 아래에 캐리어 비교 카드가 표시됩니다. UPS, DHL, FedEx, EMAX, OCS 전 캐리어의 견적을 한눈에 비교할 수 있으며, 가장 저렴한 옵션이 녹색 배지로 강조됩니다.',
          },
          {
            title: '가격 차이 표시',
            description:
              '각 캐리어 행에 현재 선택된 캐리어 대비 금액 차이(+/-)가 KRW와 퍼센트로 표시됩니다. 빠르게 비용을 비교하여 최적의 캐리어를 판단할 수 있습니다.',
          },
          {
            title: '원클릭 캐리어 전환',
            description:
              '비교 카드에서 원하는 캐리어 행을 클릭하면 즉시 해당 캐리어로 전환됩니다. 메인 계산기가 새 캐리어의 요율, 존, 운송 소요시간으로 즉시 업데이트됩니다.',
          },
          {
            title: '운송 소요시간',
            description:
              '각 캐리어별 예상 운송 소요시간이 표시됩니다 (예: UPS Express Saver "1-3일"). 비용과 함께 긴급도를 고려하여 최적의 배송 옵션을 선택하세요.',
          },
        ],
      },
      costBreakdown: {
        title: '5. 물류 비용 세부 내역',
        items: [
          {
            title: '세부 내역 확인 방법',
            description:
              '견적 요약 카드 아래에 비용 세부 내역(Cost Breakdown) 카드가 표시됩니다. 기본 운임(정가), 할인 금액, FSC, 포장 비용, 할증료, 캐리어 부가 비용, 최종 합계 등 모든 항목이 상세히 나열됩니다.',
          },
          {
            title: '기본 운임 (International Freight)',
            description:
              '캐리어의 정가 요율표(Published Tariff)에서 적용 중량과 도착지 존(Zone)에 해당하는 금액입니다. 할인 적용 전의 정가 기준 금액이며, 이 금액이 견적의 기본이 됩니다.',
          },
          {
            title: '할인 금액',
            description:
              '기본 운임에서 차감되는 할인 금액이 KRW로 표시됩니다. 예: 기본 운임 ₩200,000에 할인율 20% 적용 시 할인 금액은 ₩40,000으로 표시됩니다.',
          },
          {
            title: '유류할증료 (FSC)',
            description:
              'FSC는 할인 적용 후의 기본 운임에 대해 계산됩니다 (정가가 아닌 할인 후 금액 기준). 예: 할인 후 운임 ₩160,000 × FSC 39% = ₩62,400.',
          },
          {
            title: '포장 비용',
            description:
              '포장 유형 선택 시 포장재 비용과 인건비가 개별 항목으로 표시됩니다. 훈증 크레이트 선택 시 훈증 비용이 별도 항목으로 추가됩니다.',
          },
          {
            title: '할증료 및 부가 비용',
            description:
              '캐리어별 할증료(AHS, OWT, DAS, EAS, Surge Fee 등)가 개별적으로 표시됩니다. UPS Surge Fee(이스라엘/중동 도착지)는 자동 감지되어 적용되고, DHL OSP(과대 화물) 등은 화물 치수에 따라 자동 계산됩니다.',
          },
          {
            title: '서울 픽업 비용',
            description:
              '서울 픽업을 선택한 경우, 해당 지역과 비용이 별도 항목으로 표시됩니다. 서울 구별로 고정 KRW 요금이 적용됩니다.',
          },
          {
            title: '핵심 지표 (Key Metrics)',
            description:
              '세부 내역 상단에 적용 중량, 적용 존(Zone), 할인율(%), 운송 소요시간이 한눈에 표시됩니다. 견적의 핵심 정보를 빠르게 확인할 수 있습니다.',
          },
        ],
      },
      history: {
        title: '6. PDF 내보내기',
        items: [
          {
            title: 'PDF 견적서 내보내기',
            description:
              '전문적인 PDF 견적서를 다운로드할 수 있습니다. 배송 상세, 화물 목록, 비용 세부 내역이 포함되며 KRW 기준 총 견적 금액이 표시됩니다. 고객 커뮤니케이션이나 내부 기록용으로 활용하세요.',
          },
          {
            title: '캐리어 비교 PDF',
            description:
              '전 캐리어 비교 견적을 하나의 PDF로 내보낼 수 있습니다. 의사결정자에게 여러 캐리어 옵션을 한눈에 제시할 때 유용합니다.',
          },
        ],
      },
      systemSettings: {
        title: '7. 시스템 설정',
        items: [
          {
            title: '할인 규칙 관리',
            description:
              '특정 사용자나 국적에 대해 우선순위 기반(P100~P0) 할인 규칙을 설정하고 관리합니다.',
            adminOnly: true,
          },
          {
            title: '유류할증료 및 할증료',
            description:
              'UPS/DHL 공식 공지를 바탕으로 유류할증료(FSC)와 기타 할증료를 최신 상태로 유지합니다.',
            adminOnly: true,
          },
        ],
      },
      userOperations: {
        title: '8. 운영 관리',
        items: [
          {
            title: '사용자 및 고객 관리',
            description:
              '내부 사용자 계정과 고객사 정보를 관리합니다. 저장된 견적은 특정 고객과 연결하여 추적할 수 있습니다.',
            adminOnly: true,
          },
          {
            title: '요율표 확인',
            description:
              '지원하는 운송사별 중량 및 존(Zone) 기반 공고 요율표를 열람할 수 있습니다.',
            adminOnly: true,
          },
        ],
      },
      auditLog: {
        title: '9. 감사 및 기록',
        items: [
          {
            title: '작업 이력 추적',
            description:
              '모든 설정 변경 사항은 타임스탬프 및 작업자 정보와 함께 기록되어 투명한 운영을 지원합니다.',
            adminOnly: true,
          },
        ],
      },
    },
  },
};
