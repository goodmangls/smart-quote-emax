module Constants
  module EmaxTariff
    # EMAX_RATES contains the per-kg multiplier
    EMAX_RATES = {
      "CN" => 13500,
      "VN" => 10000
    }
    EMAX_HANDLING_CHARGE = 15000

    # EMAX FSC is per-kg KRW (no percentage), 15-day variable.
    # Mirror of frontend src/config/emax_tariff.ts EMAX_FSC_PER_KG.
    EMAX_FSC_PER_KG = {
      "CN" => 2000,
      "VN" => 2100
    }
  end
end
