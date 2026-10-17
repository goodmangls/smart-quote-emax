require "rails_helper"

# The shared quote page reads a fixed key set from GET /api/v1/shared/:token.
# shared/test-fixtures/shared-quote-contract.json is the same key set the
# frontend's SharedQuoteData type and SharedQuotePage test are written against.
RSpec.describe "Api::V1::QuoteShares", type: :request do
  let(:contract_keys) do
    JSON.parse(Rails.root.join("..", "shared", "test-fixtures", "shared-quote-contract.json").read).keys
  end

  def json
    JSON.parse(response.body)
  end

  let!(:quote) do
    create(:quote,
           share_token: "contract-token-123",
           share_expires_at: 7.days.from_now,
           overseas_carrier: "DHL",
           transit_time: "3-5 days")
  end

  describe "GET /api/v1/shared/:token" do
    before { get "/api/v1/shared/contract-token-123" }

    it "serves every key the shared page reads" do
      expect(response).to have_http_status(:ok)
      expect(json.keys).to include(*contract_keys)
    end

    it "emits the USD total under the key the frontend reads" do
      expect(json["totalQuoteAmountUSD"]).to be_a(Numeric)
    end

    it "names the carrier the customer chose" do
      expect(json["overseasCarrier"]).to eq("DHL")
    end

    it "returns the stored transit time" do
      expect(json["transitTime"]).to eq("3-5 days")
    end

    it "keeps the cost fields in the share payload" do
      expect(json).to include("totalCostAmount", "discountAmount", "breakdown")
    end
  end
end
