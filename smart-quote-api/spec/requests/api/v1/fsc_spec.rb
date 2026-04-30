require "rails_helper"

RSpec.describe "Api::V1::Fsc", type: :request do
  let(:admin) { create(:user, :admin) }
  let(:user) { create(:user) }
  let(:admin_headers) { auth_headers(jwt_token_for(admin)) }
  let(:user_headers) { auth_headers(jwt_token_for(user)) }

  def json
    JSON.parse(response.body)
  end

  describe "GET /api/v1/fsc/rates" do
    it "returns rates for all four carriers (auto-seeded on first call)" do
      get "/api/v1/fsc/rates", headers: user_headers

      expect(response).to have_http_status(:ok)
      expect(json["rates"].keys).to match_array(%w[UPS DHL FEDEX OCS])
      expect(json).to have_key("updatedAt")
    end

    it "rejects unauthenticated requests" do
      get "/api/v1/fsc/rates"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/fsc/update" do
    it "updates FEDEX rate for admin" do
      post "/api/v1/fsc/update",
           params: { carrier: "FEDEX", international: 50.0, domestic: 50.0 },
           headers: admin_headers,
           as: :json

      expect(response).to have_http_status(:ok)
      expect(json["success"]).to eq(true)
      expect(FscRate.find_by(carrier: "FEDEX").international.to_f).to eq(50.0)
    end

    it "updates OCS rate for admin" do
      post "/api/v1/fsc/update",
           params: { carrier: "OCS", international: 12.5, domestic: 12.5 },
           headers: admin_headers,
           as: :json

      expect(response).to have_http_status(:ok)
      expect(FscRate.find_by(carrier: "OCS").international.to_f).to eq(12.5)
    end

    it "rejects INVALID carrier with 422" do
      post "/api/v1/fsc/update",
           params: { carrier: "INVALID", international: 10.0, domestic: 10.0 },
           headers: admin_headers,
           as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json.dig("error", "code")).to eq("INVALID_CARRIER")
    end

    it "creates an audit log on success" do
      expect {
        post "/api/v1/fsc/update",
             params: { carrier: "FEDEX", international: 50.0, domestic: 50.0 },
             headers: admin_headers,
             as: :json
      }.to change(AuditLog, :count).by(1)

      log = AuditLog.last
      expect(log.action).to eq("fsc.updated")
      expect(log.user).to eq(admin)
    end

    it "rejects non-admin users with 403" do
      post "/api/v1/fsc/update",
           params: { carrier: "FEDEX", international: 50.0, domestic: 50.0 },
           headers: user_headers,
           as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end
end
