require "rails_helper"

RSpec.describe "Api::V1::AuditLogs", type: :request do
  let(:admin) { create(:user, :admin) }
  let(:user) { create(:user) }
  let(:admin_token) { jwt_token_for(admin) }
  let(:user_token) { jwt_token_for(user) }
  let(:quote) { create(:quote, user: admin) }

  before do
    AuditLog.track!(user: admin, action: "quote.created", resource: quote, ip_address: "1.2.3.4")
    AuditLog.track!(user: admin, action: "quote.status_changed", resource: quote, metadata: { status_from: "draft", status_to: "sent" })
    AuditLog.track!(user: admin, action: "quote.email_sent", resource: quote, metadata: { recipient: "customer@example.com" })
  end

  describe "GET /api/v1/audit_logs" do
    it "returns audit logs for admin" do
      get "/api/v1/audit_logs", headers: auth_headers(admin_token)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["logs"].length).to eq(3)
      expect(body["pagination"]["totalCount"]).to eq(3)
    end

    it "returns 403 for non-admin users" do
      get "/api/v1/audit_logs", headers: auth_headers(user_token)

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 401 without token" do
      get "/api/v1/audit_logs"

      expect(response).to have_http_status(:unauthorized)
    end

    it "filters by action_type" do
      get "/api/v1/audit_logs", params: { action_type: "quote.created" }, headers: auth_headers(admin_token)

      body = JSON.parse(response.body)
      expect(body["logs"].length).to eq(1)
      expect(body["logs"].first["action"]).to eq("quote.created")
    end

    it "searches by resource_ref" do
      get "/api/v1/audit_logs", params: { q: quote.reference_no }, headers: auth_headers(admin_token)

      body = JSON.parse(response.body)
      expect(body["logs"].length).to eq(3)
    end

    it "returns correct serialized fields" do
      get "/api/v1/audit_logs", headers: auth_headers(admin_token)

      log = JSON.parse(response.body)["logs"].first
      expect(log).to include(
        "action", "resourceType", "resourceId", "resourceRef",
        "metadata", "ipAddress", "userName", "userId", "createdAt"
      )
    end

    it "paginates results" do
      get "/api/v1/audit_logs", params: { per_page: 2, page: 1 }, headers: auth_headers(admin_token)

      body = JSON.parse(response.body)
      expect(body["logs"].length).to eq(2)
      expect(body["pagination"]["totalPages"]).to eq(2)
      expect(body["pagination"]["currentPage"]).to eq(1)
    end
  end
end
