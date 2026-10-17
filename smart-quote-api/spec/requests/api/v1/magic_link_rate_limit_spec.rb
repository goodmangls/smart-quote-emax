require "rails_helper"

# Rack::Attack is middleware, so these specs drive it through the full stack.
# Unlike smart-quote-main, emax does not disable it in the test env (it stays
# enabled suite-wide, with memory_store cleared before each example), so this
# file only resets the counters and never flips the enabled flag.
#
# A magic link token is credential-equivalent: whoever presents a valid one is
# handed a session. The verify path is POST-only, and without its own rule it
# was bounded only by the general 300/minute API limit.
RSpec.describe "Magic link verification rate limiting", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:user) { create(:user, email: "throttle@example.com") }

  before { Rack::Attack.reset! }
  after { Rack::Attack.reset! }

  # Rack::Attack counts into fixed windows keyed by Time.now.to_i / period, so a
  # real clock tick partway through the loop would reset the counter and make
  # the assertion flaky. Freeze the clock to keep every request in one window.
  it "returns 429 once the per-minute limit is exceeded" do
    freeze_time do
      20.times do
        post "/api/v1/auth/magic_link/verify", params: { token: "bogus" }, as: :json
        expect(response).to have_http_status(:unauthorized)
      end

      post "/api/v1/auth/magic_link/verify", params: { token: "bogus" }, as: :json

      expect(response).to have_http_status(:too_many_requests)
      expect(JSON.parse(response.body).dig("error", "code")).to eq("RATE_LIMITED")
    end
  end

  it "lets a legitimate verification through under the limit" do
    raw = MagicLinkToken.generate!(user)

    freeze_time do
      3.times do
        post "/api/v1/auth/magic_link/verify", params: { token: "bogus" }, as: :json
        expect(response).to have_http_status(:unauthorized)
      end

      post "/api/v1/auth/magic_link/verify", params: { token: raw }, as: :json
      expect(response).to have_http_status(:ok)
    end
  end
end
