require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  around do |example|
    old_secure = ENV["REFRESH_COOKIE_SECURE"]
    old_same_site = ENV["REFRESH_COOKIE_SAME_SITE"]
    ENV["REFRESH_COOKIE_SECURE"] = "true"
    ENV["REFRESH_COOKIE_SAME_SITE"] = "None"
    example.run
  ensure
    ENV["REFRESH_COOKIE_SECURE"] = old_secure
    ENV["REFRESH_COOKIE_SAME_SITE"] = old_same_site
  end

  def expect_refresh_cookie!
    set_cookie = response.headers["Set-Cookie"]
    expect(set_cookie).to include("refresh_token=")
    expect(set_cookie).to include("HttpOnly")
    expect(set_cookie).to include("Secure")
    expect(set_cookie).to include("SameSite=None")
  end

  describe "POST /api/v1/auth/register" do
    let(:valid_params) do
      {
        email: "newuser@example.com",
        password: "password123",
        password_confirmation: "password123",
        name: "New User",
        company: "Test Corp",
        nationality: "KR"
      }
    end

    it "creates a user and returns access token while setting refresh cookie" do
      post "/api/v1/auth/register", params: valid_params, as: :json

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["token"]).to be_present
      expect(body).not_to have_key("refresh_token")
      expect_refresh_cookie!
      expect(body["user"]["email"]).to eq("newuser@example.com")
      expect(body["user"]["role"]).to eq("user")
      expect(body["user"]["name"]).to eq("New User")
    end

    it "rejects duplicate email" do
      create(:user, email: "newuser@example.com")
      post "/api/v1/auth/register", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body["error"]["message"]).to include("Email has already been taken")
    end

    it "rejects short password" do
      post "/api/v1/auth/register", params: valid_params.merge(password: "short", password_confirmation: "short"), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "rejects mismatched password confirmation" do
      post "/api/v1/auth/register", params: valid_params.merge(password_confirmation: "different"), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "POST /api/v1/auth/login" do
    let!(:user) { create(:user, email: "test@example.com", password: "password123") }

    it "returns access token for valid credentials while setting refresh cookie" do
      post "/api/v1/auth/login", params: { email: "test@example.com", password: "password123" }, as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["token"]).to be_present
      expect(body).not_to have_key("refresh_token")
      expect_refresh_cookie!
      expect(body["user"]["email"]).to eq("test@example.com")
    end

    it "rejects wrong password" do
      post "/api/v1/auth/login", params: { email: "test@example.com", password: "wrong" }, as: :json

      expect(response).to have_http_status(:unauthorized)
      body = JSON.parse(response.body)
      expect(body["error"]["message"]).to eq("Invalid email or password")
    end

    it "rejects nonexistent email" do
      post "/api/v1/auth/login", params: { email: "nobody@example.com", password: "password123" }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "handles case-insensitive email" do
      post "/api/v1/auth/login", params: { email: "TEST@example.com", password: "password123" }, as: :json

      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /api/v1/auth/me" do
    let(:user) { create(:user) }

    it "returns current user with valid token" do
      token = jwt_token_for(user)
      get "/api/v1/auth/me", headers: auth_headers(token)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["email"]).to eq(user.email)
      expect(body["role"]).to eq(user.role)
    end

    it "returns 401 without token" do
      get "/api/v1/auth/me"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 with invalid token" do
      get "/api/v1/auth/me", headers: { "Authorization" => "Bearer invalid.token.here" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 with expired token" do
      token = jwt_token_for(user, exp: 1.hour.ago.to_i)
      get "/api/v1/auth/me", headers: auth_headers(token)

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/auth/refresh" do
    let!(:user) { create(:user, email: "refresh@example.com", password: "password123") }

    it "rotates refresh token from HttpOnly cookie and does not expose it in JSON" do
      post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
      refresh_cookie = response.cookies["refresh_token"]

      post "/api/v1/auth/refresh", headers: { "Cookie" => "refresh_token=#{refresh_cookie}" }, as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["token"]).to be_present
      expect(body).not_to have_key("refresh_token")
      expect_refresh_cookie!
    end

    it "rejects refresh token sent in JSON body without the HttpOnly cookie" do
      legacy_body_token = encode_refresh_token(user)

      post "/api/v1/auth/refresh", params: { refresh_token: legacy_body_token }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/auth/logout" do
    it "expires the refresh cookie" do
      post "/api/v1/auth/logout", as: :json

      expect(response).to have_http_status(:ok)
      expect(response.headers["Set-Cookie"]).to include("refresh_token=")
      expect(response.headers["Set-Cookie"]).to include("expires=")
    end
  end
end
