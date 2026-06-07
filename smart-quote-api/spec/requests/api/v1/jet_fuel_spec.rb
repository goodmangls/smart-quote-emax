require "rails_helper"

RSpec.describe "Api::V1::JetFuel", type: :request do
  describe "GET /api/v1/jet_fuel" do
    around do |example|
      original = ENV["EIA_API_KEY"]
      ENV.delete("EIA_API_KEY")
      example.run
      ENV["EIA_API_KEY"] = original
    end

    it "returns an empty dataset instead of a console-noisy 503 when EIA is not configured" do
      get "/api/v1/jet_fuel?weeks=12"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["data"]).to eq([])
      expect(json["warning"]["code"]).to eq("EIA_NOT_CONFIGURED")
    end
  end
end
