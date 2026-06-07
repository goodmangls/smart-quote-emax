require "rails_helper"

RSpec.describe "Api::V1::JetFuel", type: :request do
  describe "GET /api/v1/jet_fuel" do
    around do |example|
      original = ENV["EIA_API_KEY"]
      ENV.delete("EIA_API_KEY")
      example.run
      ENV["EIA_API_KEY"] = original
    end

    it "uses the EIA demo key instead of returning a console-noisy 503 when EIA_API_KEY is not configured" do
      response_body = {
        "response" => {
          "data" => [
            { "period" => "2026-05-29", "value" => "2.05" },
            { "period" => "2026-05-22", "value" => "2.01" }
          ]
        }
      }.to_json

      allow(Net::HTTP).to receive(:get_response) do |uri|
        expect(uri.query).to include("api_key=DEMO_KEY")
        instance_double(Net::HTTPSuccess, is_a?: true, body: response_body)
      end

      get "/api/v1/jet_fuel?weeks=12"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"]).to eq([
        { "date" => "2026-05-22", "price" => 2.01 },
        { "date" => "2026-05-29", "price" => 2.05 }
      ])
      expect(json["warning"]["code"]).to eq("EIA_DEMO_KEY")
    end
  end
end
