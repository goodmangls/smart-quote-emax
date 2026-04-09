require "rails_helper"

RSpec.describe "Api::V1::Auth Magic Link", type: :request do
  let!(:user) { create(:user, email: "user@example.com") }

  describe "POST /api/v1/auth/magic_link" do
    it "returns 200 for a known email" do
      post "/api/v1/auth/magic_link", params: { email: "user@example.com" }, as: :json
      expect(response).to have_http_status(:ok)
    end

    it "returns 200 even for an unknown email (no user enumeration)" do
      post "/api/v1/auth/magic_link", params: { email: "unknown@example.com" }, as: :json
      expect(response).to have_http_status(:ok)
    end

    it "creates a MagicLinkToken for the known user" do
      expect {
        post "/api/v1/auth/magic_link", params: { email: "user@example.com" }, as: :json
      }.to change(MagicLinkToken, :count).by(1)
    end

    it "does not create a token for an unknown email" do
      expect {
        post "/api/v1/auth/magic_link", params: { email: "unknown@example.com" }, as: :json
      }.not_to change(MagicLinkToken, :count)
    end
  end

  describe "POST /api/v1/auth/magic_link/verify" do
    let(:raw_token) { MagicLinkToken.generate!(user) }

    it "returns a JWT token for a valid raw token" do
      post "/api/v1/auth/magic_link/verify", params: { token: raw_token }, as: :json
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["token"]).to be_present
    end

    it "returns user info alongside the JWT" do
      post "/api/v1/auth/magic_link/verify", params: { token: raw_token }, as: :json
      body = JSON.parse(response.body)
      expect(body["user"]["email"]).to eq("user@example.com")
    end

    it "marks the token as used after verification" do
      post "/api/v1/auth/magic_link/verify", params: { token: raw_token }, as: :json
      expect(MagicLinkToken.last.used_at).not_to be_nil
    end

    it "returns 401 for an already used token" do
      MagicLinkToken.find_valid_token!(raw_token).consume!
      post "/api/v1/auth/magic_link/verify", params: { token: raw_token }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 for an expired token" do
      raw_token  # trigger creation
      MagicLinkToken.last.update!(expires_at: 1.minute.ago)
      post "/api/v1/auth/magic_link/verify", params: { token: raw_token }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 for a completely invalid token" do
      post "/api/v1/auth/magic_link/verify", params: { token: "bogus_token_xyz" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
