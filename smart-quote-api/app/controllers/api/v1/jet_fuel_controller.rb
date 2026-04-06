module Api
  module V1
    class JetFuelController < ApplicationController
      # No authentication required (public endpoint, same as exchange_rates)

      # GET /api/v1/jet_fuel?weeks=12
      def index
        api_key = ENV["EIA_API_KEY"]
        unless api_key
          return render json: { error: { code: "EIA_NOT_CONFIGURED", message: "EIA API key not configured" } },
                        status: :service_unavailable
        end

        weeks = (params[:weeks] || 12).to_i.clamp(1, 52)

        url = URI("https://api.eia.gov/v2/petroleum/pri/spt/data/")
        url.query = URI.encode_www_form(
          "api_key" => api_key,
          "frequency" => "weekly",
          "data[0]" => "value",
          "facets[product][]" => "EPJK",
          "facets[duoarea][]" => "RGC",
          "sort[0][column]" => "period",
          "sort[0][direction]" => "desc",
          "length" => weeks.to_s
        )

        response = Net::HTTP.get_response(url)
        unless response.is_a?(Net::HTTPSuccess)
          return render json: { error: { code: "EIA_UPSTREAM_ERROR", message: "EIA API returned #{response.code}" } },
                        status: :bad_gateway
        end

        body = JSON.parse(response.body)
        data = body.dig("response", "data") || []

        prices = data.filter_map { |d|
          price = Float(d["value"], exception: false)
          next unless price

          { date: d["period"], price: price }
        }.reverse

        render json: { data: prices }
      rescue StandardError => e
        render json: { error: { code: "JET_FUEL_ERROR", message: e.message } },
               status: :internal_server_error
      end
    end
  end
end
