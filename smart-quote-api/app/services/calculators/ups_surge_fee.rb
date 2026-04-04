# UPS Surge Fee (급증 수수료) - 2026-03-15부터 별도 공지 시까지
# Source: UPS Korea 급증 수수료 공지 (2026-03-14 업데이트)
# 한국 출발 수출 화물 → Middle East / Israel 도착지
# Billable weight(kg) 기준, FSC 적용됨
module Calculators
  class UpsSurgeFee
    # Israel: KRW 4,722/kg
    ISRAEL_COUNTRIES = %w[IL].freeze
    ISRAEL_RATE = 4_722

    # Middle East: KRW 2,004/kg
    MIDDLE_EAST_COUNTRIES = %w[
      AF BH BD EG IQ JO KW LB NP OM PK QA SA LK AE
    ].freeze
    MIDDLE_EAST_RATE = 2_004

    def self.call(country:, billable_weight:, fsc_percent:)
      new(country, billable_weight, fsc_percent).call
    end

    def initialize(country, billable_weight, fsc_percent)
      @country = country
      @billable_weight = billable_weight
      @fsc_percent = fsc_percent
    end

    def call
      rate_info = determine_rate
      return nil unless rate_info

      amount = @billable_weight.ceil * rate_info[:rate]
      fsc = amount * (@fsc_percent.to_f / 100)

      {
        code: "SGF",
        name: "Surge Fee (#{rate_info[:region]})",
        name_ko: "급증수수료 (#{rate_info[:region]})",
        amount: amount,
        fsc_amount: fsc,
        total: amount + fsc
      }
    end

    private

    def determine_rate
      if ISRAEL_COUNTRIES.include?(@country)
        { rate: ISRAEL_RATE, region: "Israel" }
      elsif MIDDLE_EAST_COUNTRIES.include?(@country)
        { rate: MIDDLE_EAST_RATE, region: "Middle East" }
      end
    end
  end
end
