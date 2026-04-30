module Calculators
  class OcsZone
    def self.call(country)
      new(country).call
    end

    def initialize(country)
      @country = country
    end

    def call
      # Z1: Taiwan, Hong Kong, Singapore
      return result("Z1", "Z1/TW-HK-SG") if %w[TW HK SG].include?(@country)

      # Z2: China
      return result("Z2", "Z2/CN") if @country == "CN"

      # Z3: Japan
      return result("Z3", "Z3/JP") if @country == "JP"

      # Outside supported list (5 countries) → Z1 fallback (warning surfaced in orchestrator)
      result("Z1", "OCS (unsupported, Z1 fallback)")
    end

    private

    def result(rate_key, label)
      { rate_key: rate_key, label: label }
    end
  end
end
