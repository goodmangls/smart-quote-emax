module Calculators
  class DhlZone
    def self.call(country)
      new(country).call
    end

    def initialize(country)
      @country = country
    end

    def call
      # Aligned with DHL Express Korea 공식 항공요금표 (2026-02)

      # Zone 1: 중국, 홍콩, 싱가포르 (TW/MO not in PDF — kept provisionally, verify with DHL)
      return result('Z1', 'China/HK/SG') if %w[CN HK MO SG TW].include?(@country)

      # Zone 2: 일본
      return result('Z2', 'Japan') if %w[JP].include?(@country)

      # Zone 3: 필리핀, 베트남, 태국
      return result('Z3', 'PH/VN/TH') if %w[PH VN TH].include?(@country)

      # Zone 4: 호주, 캄보디아, 인도
      return result('Z4', 'AU/KH/IN') if %w[AU KH IN].include?(@country)

      # Zone 5: 미국, 캐나다
      return result('Z5', 'US/CA') if %w[US CA].include?(@country)

      # Zone 6: 유럽 (서유럽 + 북유럽)
      if %w[GB FR DE IT ES DK NL BE CH FI SE NO AT PT IE MC].include?(@country)
        return result('Z6', 'Europe')
      end

      # Zone 7: 동유럽
      if %w[CZ PL HU RO BG].include?(@country)
        return result('Z7', 'Eastern Europe')
      end

      # Zone 8: 남미, 아프리카, 중동
      if %w[BR AR CL CO ZA EG AE TR BH IL JO LB SA PK].include?(@country)
        return result('Z8', 'S.Am/Africa/ME')
      end

      # Default catch-all
      result('Z8', 'Rest of World')
    end

    private

    def result(rate_key, label)
      { rate_key: rate_key, label: label }
    end
  end
end
