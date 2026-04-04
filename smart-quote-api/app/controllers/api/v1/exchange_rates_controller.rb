module Api
  module V1
    class ExchangeRatesController < ApplicationController
      # No authentication required (public endpoint)

      # GET /api/v1/exchange_rates
      def index
        result = ExchangeRateFetcher.current_rates

        if result
          render json: result
        else
          render json: {
            error: { code: "EXCHANGE_RATE_UNAVAILABLE", message: "Exchange rate service temporarily unavailable" }
          }, status: :service_unavailable
        end
      end
    end
  end
end
