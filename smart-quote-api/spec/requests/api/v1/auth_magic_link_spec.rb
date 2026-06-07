require "rails_helper"

RSpec.describe "Api::V1::Auth Magic Link", type: :request do
  let!(:user) { create(:user, email: "user@example.com") }

  around do |example|
    original = ENV["FRONTEND_URL"]
    ENV["FRONTEND_URL"] = "https://smart-quote-emax.test"
    ActionMailer::Base.deliveries.clear
    example.run
    ActionMailer::Base.deliveries.clear
    ENV["FRONTEND_URL"] = original
  end

  describe "POST /api/v1/auth/magic_link" do
    it "returns 200 for a known email" do
      post "/api/v1/auth/magic_link", params: { email: "user@example.com" }, as: :json
      expect(response).to have_http_status(:ok)
    end

    it "returns 200 even for an unknown email (no user enumeration)" do
      post "/api/v1/auth/magic_link", params: { email: "unknown@example.com" }, as: :json
      expect(response).to have_http_status(:ok)
    end

    it "creates a MagicLinkToken and sends a polished email for the known user" do
      expect {
        post "/api/v1/auth/magic_link", params: { email: "user@example.com" }, as: :json
      }.to change(MagicLinkToken, :count).by(1)
        .and change(ActionMailer::Base.deliveries, :count).by(1)

      mail = ActionMailer::Base.deliveries.last
      expect(mail.to).to eq([ "user@example.com" ])
      expect(mail.subject).to eq("[E-MAX] Your sign-in link")
      expect(mail.html_part.body.decoded).to include("Your secure sign-in link is ready")
      expect(mail.html_part.body.decoded).to include("color:#ffffff; mso-line-height-rule:exactly;")
    end

    it "does not create a token or deliver mail for an unknown email" do
      expect {
        post "/api/v1/auth/magic_link", params: { email: "unknown@example.com" }, as: :json
      }.not_to change(MagicLinkToken, :count)

      expect(ActionMailer::Base.deliveries).to be_empty
    end
  end

  describe "POST /api/v1/auth/magic_link/verify" do
    let(:raw_token) { MagicLinkToken.generate!(user) }

    it "returns a JWT token for a valid raw token" do
      post "/api/v1/auth/magic_link/verify", params: { token: raw_token }, as: :json
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["token"]).to be_present
      expect(body).not_to have_key("refresh_token")
      expect(response.headers["Set-Cookie"]).to include("refresh_token=")
      expect(response.headers["Set-Cookie"]).to include("HttpOnly")
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
