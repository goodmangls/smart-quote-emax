require "net/http"
require "json"

class ExchangeRateFetcher
  CACHE_KEY = "exchange_rates_cache"
  PREV_CACHE_KEY = "exchange_rates_prev"
  CACHE_TTL = 1.hour

  TARGET_CURRENCIES = [
    { currency: "USD", code: "USA", flag: "\u{1F1FA}\u{1F1F8}" },
    { currency: "EUR", code: "EUR", flag: "\u{1F1EA}\u{1F1FA}" },
    { currency: "JPY", code: "JPN", flag: "\u{1F1EF}\u{1F1F5}" },
    { currency: "CNY", code: "CHN", flag: "\u{1F1E8}\u{1F1F3}" },
    { currency: "GBP", code: "GBR", flag: "\u{1F1EC}\u{1F1E7}" },
    { currency: "SGD", code: "SGP", flag: "\u{1F1F8}\u{1F1EC}" }
  ].freeze

  class << self
    def current_rates
      cached = read_cache
      if cached
        build_response(cached, true)
      else
        fetch_and_cache
      end
    end

    private

    def fetch_and_cache
      app_id = ENV["OPEN_EXCHANGE_APP_ID"]
      raise "OPEN_EXCHANGE_APP_ID not set" unless app_id

      uri = URI("https://openexchangerates.org/api/latest.json?app_id=#{app_id}")
      response = Net::HTTP.get_response(uri)
      raise "API error: #{response.code}" unless response.is_a?(Net::HTTPSuccess)

      data = JSON.parse(response.body)
      raw_rates = data["rates"]
      krw_rate = raw_rates["KRW"]
      raise "Missing KRW rate" unless krw_rate

      # Convert USD base -> KRW base
      inverted = {}
      TARGET_CURRENCIES.each do |tc|
        currency_rate = raw_rates[tc[:currency]]
        if currency_rate&.positive?
          inverted[tc[:currency]] = (krw_rate.to_f / currency_rate.to_f).round(2)
        end
      end

      # Save previous rates before overwriting
      prev = read_cache
      write_prev_cache(prev["rates"]) if prev

      # Write new cache
      cache_data = {
        "rates" => inverted,
        "fetched_at" => Time.current.iso8601,
        "source" => "openexchangerates"
      }
      Rails.cache.write(CACHE_KEY, cache_data.to_json, expires_in: CACHE_TTL)

      build_response(cache_data, false)
    rescue StandardError => e
      Rails.logger.warn("ExchangeRateFetcher failed: #{e.message}")
      # Fallback: return stale cache if available
      stale = read_cache
      return build_response(stale, true) if stale
      nil
    end

    def build_response(cache_data, cached)
      prev_rates = read_prev_cache || {}
      rates = TARGET_CURRENCIES.map do |tc|
        rate = cache_data["rates"][tc[:currency]] || 0
        prev = prev_rates[tc[:currency]] || rate
        change = (rate - prev).round(2)
        change_pct = prev.positive? ? ((change / prev) * 100).round(2) : 0
        trend = change.positive? ? "up" : change.negative? ? "down" : "flat"

        {
          currency: tc[:currency],
          code: tc[:code],
          flag: tc[:flag],
          rate: rate,
          previousClose: prev,
          change: change,
          changePercent: change_pct,
          trend: trend
        }
      end

      { rates: rates, fetchedAt: cache_data["fetched_at"], cached: cached }
    end

    def read_cache
      raw = Rails.cache.read(CACHE_KEY)
      return nil unless raw
      JSON.parse(raw)
    rescue JSON::ParserError
      nil
    end

    def write_prev_cache(rates)
      Rails.cache.write(PREV_CACHE_KEY, rates.to_json, expires_in: 24.hours)
    end

    def read_prev_cache
      raw = Rails.cache.read(PREV_CACHE_KEY)
      return nil unless raw
      JSON.parse(raw)
    rescue JSON::ParserError
      nil
    end
  end
end
