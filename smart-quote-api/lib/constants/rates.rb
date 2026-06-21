module Constants
  module Rates
    # Unit: KRW
    FUMIGATION_FEE = 30000
    WAR_RISK_SURCHARGE_RATE = 0  # DEC-006: War risk surcharge removed
    PACKING_MATERIAL_BASE_COST = 15000
    PACKING_LABOR_UNIT_COST = 50000
    DEFAULT_EXCHANGE_RATE = 1450 # 하나은행 월요일 09시 송금환율 (2026-03-24)
    DEFAULT_FSC_PERCENT = 43.75 # UPS default, effective 2026-06-22
    DEFAULT_FSC_PERCENT_DHL = 45.25 # DHL default, effective 2026-06-22
    DEFAULT_FSC_PERCENT_FEDEX = 41.50 # FedEx default, effective 2026-06-22
    DEFAULT_FSC_PERCENT_OCS = 25.00 # OCS default, effective 2026-05-06
    MAX_DISCOUNT_PERCENT = 100 # Maximum discount rate (%)
    UPS_FSC_URL = "https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page"
    UPS_RATES_HUB_URL = "https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates"
  end
end
