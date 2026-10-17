require "rails_helper"

# Customers are private to the user who created them (admins see all). A quote
# used to accept any customer id, and the response echoes `customerName`, so a
# member could read other users' customer names by walking ids.
RSpec.describe "Quote customer ownership", type: :request do
  let(:member) { create(:user) }
  let(:other_member) { create(:user) }
  let(:admin) { create(:user, :admin) }

  let(:own_customer) { Customer.create!(user: member, company_name: "Own Co") }
  let(:foreign_customer) { Customer.create!(user: other_member, company_name: "Someone Else Co") }

  let(:member_headers) { auth_headers(jwt_token_for(member)) }

  let(:quote_params) do
    {
      destinationCountry: "US",
      destinationZip: "10001",
      domesticRegionCode: "A",
      incoterm: "FOB",
      packingType: "NONE",
      discountPercent: 15.0,
      exchangeRate: 1300.0,
      fscPercent: 27.5,
      items: [ { description: "Electronic Parts", quantity: 2, weightPerItem: 5.0, lengthCm: 40, widthCm: 30, heightCm: 20 } ]
    }
  end

  def json
    JSON.parse(response.body)
  end

  describe "POST /api/v1/quotes" do
    it "rejects another user's customer and saves nothing" do
      expect {
        post "/api/v1/quotes", params: quote_params.merge(customerId: foreign_customer.id),
                               headers: member_headers, as: :json
      }.not_to change(Quote, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["error"]["code"]).to eq("INVALID_CUSTOMER")
      expect(response.body).not_to include("Someone Else Co")
    end

    it "answers a non-existent customer exactly like a foreign one" do
      post "/api/v1/quotes", params: quote_params.merge(customerId: 999_999),
                             headers: member_headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["error"]["code"]).to eq("INVALID_CUSTOMER")
    end

    it "accepts the member's own customer" do
      post "/api/v1/quotes", params: quote_params.merge(customerId: own_customer.id),
                             headers: member_headers, as: :json

      expect(response).to have_http_status(:created)
      expect(Quote.last.customer_id).to eq(own_customer.id)
    end

    it "lets an admin attach any customer" do
      post "/api/v1/quotes", params: quote_params.merge(customerId: foreign_customer.id),
                             headers: auth_headers(jwt_token_for(admin)), as: :json

      expect(response).to have_http_status(:created)
      expect(Quote.last.customer_id).to eq(foreign_customer.id)
    end
  end

  describe "PATCH /api/v1/quotes/:id" do
    let!(:quote) { create(:quote, user: member, customer: own_customer) }

    it "rejects another user's customer and leaves the quote unchanged" do
      patch "/api/v1/quotes/#{quote.id}", params: { customer_id: foreign_customer.id },
                                          headers: member_headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["error"]["code"]).to eq("INVALID_CUSTOMER")
      expect(quote.reload.customer_id).to eq(own_customer.id)
    end

    it "still allows detaching the customer" do
      patch "/api/v1/quotes/#{quote.id}", params: { customer_id: nil },
                                          headers: member_headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(quote.reload.customer_id).to be_nil
    end
  end
end
