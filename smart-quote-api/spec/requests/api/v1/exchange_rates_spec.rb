require "rails_helper"

RSpec.describe "Api::V1::ExchangeRates", type: :request do
  describe "GET /api/v1/exchange_rates" do
    let(:cache_data) do
      {
        "rates" => { "USD" => 1428.50, "EUR" => 1552.30, "JPY" => 9.45, "CNY" => 196.80, "GBP" => 1812.40, "SGD" => 1068.20 },
        "fetched_at" => "2026-03-13T09:00:00+09:00",
        "source" => "openexchangerates"
      }
    end

    context "when cache is available" do
      before do
        Rails.cache.write(ExchangeRateFetcher::CACHE_KEY, cache_data.to_json, expires_in: 1.hour)
      end

      it "returns cached exchange rates" do
        get "/api/v1/exchange_rates"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["rates"]).to be_an(Array)
        expect(json["rates"].length).to eq(6)
        expect(json["cached"]).to be true
        expect(json["fetchedAt"]).to be_present
      end

      it "returns rates with correct structure" do
        get "/api/v1/exchange_rates"

        json = JSON.parse(response.body)
        usd = json["rates"].find { |r| r["currency"] == "USD" }
        expect(usd).to include(
          "currency" => "USD",
          "code" => "USA",
          "rate" => 1428.50,
          "trend" => a_string_matching(/up|down|flat/)
        )
        expect(usd).to have_key("previousClose")
        expect(usd).to have_key("change")
        expect(usd).to have_key("changePercent")
      end

      it "does not require authentication" do
        get "/api/v1/exchange_rates"
        expect(response).to have_http_status(:ok)
      end
    end

    context "when cache is empty and API fails" do
      before do
        Rails.cache.clear
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with("OPEN_EXCHANGE_APP_ID").and_return("test_key")
        stub_request(:get, /openexchangerates\.org/).to_return(status: 500, body: "Server Error")
      end

      it "returns 503 when no data available" do
        get "/api/v1/exchange_rates"

        expect(response).to have_http_status(:service_unavailable)
        json = JSON.parse(response.body)
        expect(json["error"]["code"]).to eq("EXCHANGE_RATE_UNAVAILABLE")
      end
    end

    context "when cache is empty but API succeeds" do
      let(:api_response) do
        {
          "base" => "USD",
          "rates" => {
            "KRW" => 1428.50,
            "USD" => 1.0,
            "EUR" => 0.92,
            "JPY" => 151.0,
            "CNY" => 7.26,
            "GBP" => 0.788,
            "SGD" => 1.337
          }
        }
      end

      before do
        Rails.cache.clear
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with("OPEN_EXCHANGE_APP_ID").and_return("test_key")
        stub_request(:get, /openexchangerates\.org/)
          .to_return(status: 200, body: api_response.to_json, headers: { "Content-Type" => "application/json" })
      end

      it "fetches from API and caches the result" do
        get "/api/v1/exchange_rates"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["rates"]).to be_an(Array)
        expect(json["cached"]).to be false

        # Verify cache was written
        cached = Rails.cache.read(ExchangeRateFetcher::CACHE_KEY)
        expect(cached).to be_present
      end
    end
  end
end
