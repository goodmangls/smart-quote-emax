require "rails_helper"

RSpec.describe "Api::V1::DiscountRules", type: :request do
  let(:admin) { create(:user, :admin) }
  let(:user) { create(:user) }
  let(:admin_token) { jwt_token_for(admin) }
  let(:user_token) { jwt_token_for(user) }
  let(:admin_headers) { auth_headers(admin_token) }
  let(:user_headers) { auth_headers(user_token) }

  def json
    JSON.parse(response.body)
  end

  before { Rails.cache.clear }

  describe "GET /api/v1/discount_rules" do
    let!(:rule1) { create(:discount_rule, priority: 100) }
    let!(:rule2) { create(:discount_rule, priority: 50) }

    it "returns all rules sorted by priority for admin" do
      get "/api/v1/discount_rules", headers: admin_headers

      expect(response).to have_http_status(:ok)
      expect(json["rules"].length).to eq(2)
      expect(json["rules"].first["priority"]).to be >= json["rules"].last["priority"]
    end

    it "returns camelCase keys" do
      get "/api/v1/discount_rules", headers: admin_headers

      rule = json["rules"].first
      expect(rule).to have_key("ruleType")
      expect(rule).to have_key("matchEmail")
      expect(rule).to have_key("discountPercent")
      expect(rule).to have_key("isActive")
      expect(rule).to have_key("createdBy")
      expect(rule).to have_key("createdAt")
    end

    it "returns 403 for non-admin" do
      get "/api/v1/discount_rules", headers: user_headers
      expect(response).to have_http_status(:forbidden)
    end

    it "returns 401 without auth" do
      get "/api/v1/discount_rules"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/discount_rules" do
    let(:valid_params) do
      { name: "Test Rule", rule_type: "flat", priority: 80, discount_percent: 20 }
    end

    it "creates a rule for admin" do
      expect {
        post "/api/v1/discount_rules", params: valid_params, headers: admin_headers, as: :json
      }.to change(DiscountRule, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json["name"]).to eq("Test Rule")
      expect(json["createdBy"]).to eq(admin.email)
    end

    it "invalidates cache on create" do
      Rails.cache.write(DiscountRuleResolver::CACHE_KEY, "cached")
      post "/api/v1/discount_rules", params: valid_params, headers: admin_headers, as: :json
      expect(Rails.cache.read(DiscountRuleResolver::CACHE_KEY)).to be_nil
    end

    it "creates audit log on create" do
      expect {
        post "/api/v1/discount_rules", params: valid_params, headers: admin_headers, as: :json
      }.to change(AuditLog, :count).by(1)

      log = AuditLog.last
      expect(log.action).to eq("discount_rule.created")
      expect(log.resource_type).to eq("DiscountRule")
    end

    it "returns validation error for invalid discount" do
      post "/api/v1/discount_rules",
           params: valid_params.merge(discount_percent: 3),
           headers: admin_headers, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json["error"]["code"]).to eq("VALIDATION_ERROR")
    end

    it "returns 403 for non-admin" do
      post "/api/v1/discount_rules", params: valid_params, headers: user_headers, as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PUT /api/v1/discount_rules/:id" do
    let!(:rule) { create(:discount_rule, name: "Original", discount_percent: 19) }

    it "updates a rule for admin" do
      put "/api/v1/discount_rules/#{rule.id}",
          params: { name: "Updated", discount_percent: 25 },
          headers: admin_headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(json["name"]).to eq("Updated")
      expect(json["discountPercent"]).to eq(25.0)
    end

    it "invalidates cache on update" do
      Rails.cache.write(DiscountRuleResolver::CACHE_KEY, "cached")
      put "/api/v1/discount_rules/#{rule.id}",
          params: { discount_percent: 25 },
          headers: admin_headers, as: :json
      expect(Rails.cache.read(DiscountRuleResolver::CACHE_KEY)).to be_nil
    end

    it "returns validation error for invalid update" do
      put "/api/v1/discount_rules/#{rule.id}",
          params: { discount_percent: 60 },
          headers: admin_headers, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /api/v1/discount_rules/:id" do
    let!(:rule) { create(:discount_rule) }

    it "soft deletes (sets is_active=false)" do
      delete "/api/v1/discount_rules/#{rule.id}", headers: admin_headers

      expect(response).to have_http_status(:ok)
      expect(json["success"]).to be true
      expect(rule.reload.is_active).to be false
    end

    it "invalidates cache on delete" do
      Rails.cache.write(DiscountRuleResolver::CACHE_KEY, "cached")
      delete "/api/v1/discount_rules/#{rule.id}", headers: admin_headers
      expect(Rails.cache.read(DiscountRuleResolver::CACHE_KEY)).to be_nil
    end

    it "creates audit log on delete" do
      expect {
        delete "/api/v1/discount_rules/#{rule.id}", headers: admin_headers
      }.to change(AuditLog, :count).by(1)

      expect(AuditLog.last.action).to eq("discount_rule.deleted")
    end

    it "returns 403 for non-admin" do
      delete "/api/v1/discount_rules/#{rule.id}", headers: user_headers
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/discount_rules/resolve" do
    let!(:kr_heavy) do
      create(:discount_rule, name: "KR Heavy", priority: 50,
             match_nationality: "KR", weight_min: 20, discount_percent: 19)
    end

    it "returns resolved discount for authenticated user" do
      get "/api/v1/discount_rules/resolve",
          params: { email: "test@example.com", nationality: "KR", weight: 25 },
          headers: user_headers

      expect(response).to have_http_status(:ok)
      expect(json["discountPercent"]).to eq(19.0)
      expect(json["matchedRule"]["name"]).to eq("KR Heavy")
      expect(json["fallback"]).to be false
    end

    it "returns fallback when no rule matches" do
      get "/api/v1/discount_rules/resolve",
          params: { email: "test@example.com", nationality: "US", weight: 5 },
          headers: user_headers

      expect(response).to have_http_status(:ok)
      expect(json["discountPercent"]).to eq(24.0)
      expect(json["matchedRule"]).to be_nil
      expect(json["fallback"]).to be true
    end

    it "is accessible to non-admin authenticated users" do
      get "/api/v1/discount_rules/resolve",
          params: { email: "test@example.com", nationality: "US", weight: 10 },
          headers: user_headers

      expect(response).to have_http_status(:ok)
    end

    it "returns 401 without auth" do
      get "/api/v1/discount_rules/resolve",
          params: { email: "test@example.com", nationality: "US", weight: 10 }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
