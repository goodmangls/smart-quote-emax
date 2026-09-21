module Constants
  module Rates
    # Unit: KRW
    FUMIGATION_FEE = 30000
    WAR_RISK_SURCHARGE_RATE = 0  # DEC-006: War risk surcharge removed
    PACKING_MATERIAL_BASE_COST = 15000
    PACKING_LABOR_UNIT_COST = 50000
    DEFAULT_EXCHANGE_RATE = 1320 # 적용 기준환율 (2026-09-16 확인)
    DEFAULT_FSC_PERCENT = 52.50 # UPS default, effective 2026-09-21
    DEFAULT_FSC_PERCENT_DHL = 45.00 # DHL default, effective 2026-09-21
    DEFAULT_FSC_PERCENT_FEDEX = 51.75 # FedEx default, effective 2026-09-21
    DEFAULT_FSC_PERCENT_OCS = 25.00 # OCS default, effective 2026-07-20
    MAX_DISCOUNT_PERCENT = 80 # Maximum discount rate (%) — keep in sync with src/config/business-rules.ts
    UPS_FSC_URL = "https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page"
    UPS_RATES_HUB_URL = "https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates"
  end
end
