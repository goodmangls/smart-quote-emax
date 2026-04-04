module Api
  module V1
    class CustomersController < ApplicationController
      include JwtAuthenticatable

      before_action :authenticate_user!

      # GET /api/v1/customers
      def index
        customers = scoped_customers
                      .search_text(params[:q])
                      .recent
                      .left_joins(:quotes)
                      .select("customers.*, COUNT(quotes.id) AS quotes_count_cache")
                      .group("customers.id")

        render json: customers.map { |c| customer_json(c, preloaded_count: true) }
      end

      # GET /api/v1/customers/:id
      def show
        customer = scoped_customers.find(params[:id])
        render json: customer_json(customer, include_quotes: true)
      rescue ActiveRecord::RecordNotFound
        render json: { error: { code: "NOT_FOUND", message: "Customer not found" } }, status: :not_found
      end

      # POST /api/v1/customers
      def create
        customer = scoped_customers.new(customer_params)

        if customer.save
          render json: customer_json(customer), status: :created
        else
          render json: { error: { code: "VALIDATION_ERROR", message: customer.errors.full_messages.join(", ") } }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/customers/:id
      def update
        customer = scoped_customers.find(params[:id])

        if customer.update(customer_params)
          render json: customer_json(customer)
        else
          render json: { error: { code: "VALIDATION_ERROR", message: customer.errors.full_messages.join(", ") } }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: { code: "NOT_FOUND", message: "Customer not found" } }, status: :not_found
      end

      # DELETE /api/v1/customers/:id
      def destroy
        scoped_customers.find(params[:id]).destroy
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render json: { error: { code: "NOT_FOUND", message: "Customer not found" } }, status: :not_found
      end

      private

      def scoped_customers
        if current_user.role == "admin"
          Customer.all
        else
          current_user.customers
        end
      end

      def customer_params
        params.permit(:company_name, :contact_name, :email, :phone, :country, :address, :notes)
              .to_h
              .transform_keys { |k| k.to_s.underscore }
      end

      def customer_json(customer, include_quotes: false, preloaded_count: false)
        json = {
          id: customer.id,
          companyName: customer.company_name,
          contactName: customer.contact_name,
          email: customer.email,
          phone: customer.phone,
          country: customer.country,
          address: customer.address,
          notes: customer.notes,
          quoteCount: preloaded_count ? (customer.attributes["quotes_count_cache"] || 0).to_i : customer.quotes.count,
          createdAt: customer.created_at.iso8601,
          updatedAt: customer.updated_at.iso8601
        }

        if include_quotes
          json[:recentQuotes] = customer.quotes.recent.limit(5).map do |q|
            {
              id: q.id,
              referenceNo: q.reference_no,
              destinationCountry: q.destination_country,
              totalQuoteAmount: q.total_quote_amount.to_i,
              status: q.status,
              createdAt: q.created_at.iso8601
            }
          end
        end

        json
      end
    end
  end
end
