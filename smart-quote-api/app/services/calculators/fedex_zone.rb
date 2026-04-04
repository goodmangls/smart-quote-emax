module Calculators
  class FedexZone
    def self.call(country)
      new(country).call
    end

    def initialize(country)
      @country = country
    end

    def call
      # Zone V: Hong Kong
      return result('ZV', 'Hong Kong') if %w[HK].include?(@country)

      # Zone A: Macau
      return result('ZA', 'Macau') if %w[MO].include?(@country)

      # Zone W: China
      return result('ZW', 'China') if %w[CN].include?(@country)

      # Zone X: Taiwan
      return result('ZX', 'Taiwan') if %w[TW].include?(@country)

      # Zone Y: Singapore
      return result('ZY', 'Singapore') if %w[SG].include?(@country)

      # Zone P: Japan
      return result('ZP', 'Japan') if %w[JP].include?(@country)

      # Zone Q: Malaysia
      return result('ZQ', 'Malaysia') if %w[MY].include?(@country)

      # Zone R: Thailand
      return result('ZR', 'Thailand') if %w[TH].include?(@country)

      # Zone S: Philippines
      return result('ZS', 'Philippines') if %w[PH].include?(@country)

      # Zone T: Indonesia
      return result('ZT', 'Indonesia') if %w[ID].include?(@country)

      # Zone N: Vietnam
      return result('ZN', 'Vietnam') if %w[VN].include?(@country)

      # Zone O: India
      return result('ZO', 'India') if %w[IN].include?(@country)

      # Zone U: Australia
      return result('ZU', 'Australia') if %w[AU].include?(@country)

      # Zone D: Guam, Saipan, Laos, Mongolia, Brunei
      return result('ZD', 'GU/MP/LA/MN/BN') if %w[GU MP LA MN BN].include?(@country)

      # Zone F: USA, Canada, New Zealand, Mexico (Treating E/US West also as F for simplicity unless specialized routing exists)
      return result('ZF', 'US/CA/NZ/MX') if %w[US CA NZ MX].include?(@country)

      # Zone M: Italy, Spain, UK, Germany, France, etc. (Western Europe)
      if %w[IT ES GB DE FR CH FI SE NO PT IE MC].include?(@country)
        return result('ZM', 'Western Europe')
      end

      # Zone G: Austria, Denmark, Hungary, Belgium, Czech, Greece, Netherlands, Poland, Israel
      if %w[AT DK HU BE CZ GR NL PL IL].include?(@country)
        return result('ZG', 'Europe II')
      end

      # Zone H: Eastern Europe, Russia, Romania, Turkey
      if %w[RU RO TR BG EE LV LT SK SI UA BY].include?(@country)
        return result('ZH', 'Eastern Europe')
      end

      # Zone I: South America
      if %w[AR BR CL PY PE UY CO VE EC BO].include?(@country)
        return result('ZI', 'South America')
      end

      # Zone J: Middle East & Africa (Approximation)
      if %w[AE SA BH QA JO LB EG ZA PK].include?(@country)
        return result('ZJ', 'Middle East')
      end

      # Default catch-all
      result('ZJ', 'Rest of World')
    end

    private

    def result(rate_key, label)
      { rate_key: rate_key, label: label }
    end
  end
end
