module Api
  module V1
    class QuotesController < ApplicationController
      include JwtAuthenticatable

      InvalidInputError = Class.new(StandardError)

      # Ported from smart-quote-main. Without these, a caller could send
      # fscPercent 9999 and get a total ~200x the correct one, or exchangeRate 0
      # and get a 200 whose totalQuoteAmountUSD was silently null — both
      # confirmed live against production on 2026-08-26.
      #
      # nil means "not supplied" and is always allowed; the calculator has its
      # own defaults. discountPercent is deliberately absent — the calculator
      # already clamps it to 0..MAX_DISCOUNT_PERCENT, which bounds the money.
      NUMERIC_INPUT_BOUNDS = {
        "exchangeRate" => { min: 0, exclusive_min: true, max: 10_000 },
        "fscPercent" => { min: 0, max: 200 },
        "dutyTaxEstimate" => { min: 0 },
        "manualDomesticCost" => { min: 0 },
        "manualPackingCost" => { min: 0 },
        "manualSurgeCost" => { min: 0 },
        "pickupInSeoulCost" => { min: 0 },
        "dhlDeclaredValue" => { min: 0 },
        "fedexDeclaredValue" => { min: 0 }
      }.freeze

      # Anything not matching this is rejected outright rather than coerced.
      # `"abc".to_f` and `"".to_f` are both 0.0, so a range check alone accepts
      # junk as a valid zero.
      NUMERIC_INPUT_PATTERN = /\A-?\d+(\.\d+)?\z/

      before_action :authenticate_user!, except: [ :calculate ]

      # POST /api/v1/quotes/calculate (public - stateless)
      def calculate
        input = clean_params
        validate_numeric_bounds!(input)
        result = QuoteCalculator.call(input)
        render json: result
        # Must precede the StandardError rescue below, which would otherwise
        # flatten a specific "fscPercent must be at most 200" into a generic
        # "Failed to calculate quote" and tell the caller nothing.
      rescue InvalidInputError => e
        render json: { error: { code: "INVALID_INPUT", message: e.message } }, status: :unprocessable_content
      rescue StandardError => e
        Rails.logger.error "[CALCULATE] #{e.class}: #{e.message}"
        render json: { error: { code: "CALCULATION_ERROR", message: "Failed to calculate quote" } }, status: :unprocessable_content
      end

      # POST /api/v1/quotes (calculate + save)
      def create
        input = clean_params
        validate_numeric_bounds!(input)
        result = QuoteCalculator.call(input)

        quote = current_user.quotes.new(
          **input_attributes(input),
          **result_attributes(result),
          items: input["items"] || input[:items],
          breakdown: result[:breakdown],
          warnings: result[:warnings] || [],
          notes: params[:notes],
          customer_id: params[:customerId]
        )

        if quote.save
          AuditLog.track!(user: current_user, action: "quote.created", resource: quote, ip_address: request.remote_ip)
          render json: QuoteSerializer.detail(quote), status: :created
        else
          render json: { error: { code: "VALIDATION_ERROR", message: quote.errors.full_messages.join(", ") } }, status: :unprocessable_content
        end
      rescue InvalidInputError => e
        render json: { error: { code: "INVALID_INPUT", message: e.message } }, status: :unprocessable_content
      rescue StandardError => e
        # Without this, save-path exceptions surface as bare 500s with empty
        # bodies — the schema-drift outage went undiagnosable for months.
        Rails.logger.error "[CREATE] #{e.class}: #{e.message}"
        render json: { error: { code: "CALCULATION_ERROR", message: "Failed to create quote" } }, status: :unprocessable_content
      end

      # GET /api/v1/quotes
      def index
        expire_stale_drafts!

        quotes = QuoteSearcher.call(scoped_quotes, params)
                      .page(params[:page] || 1)
                      .per([ (params[:per_page] || 20).to_i, 100 ].min)

        render json: {
          quotes: QuoteSerializer.summaries(quotes),
          pagination: {
            currentPage: quotes.current_page,
            totalPages: quotes.total_pages,
            totalCount: quotes.total_count,
            perPage: quotes.limit_value
          }
        }
      end

      # GET /api/v1/quotes/:id
      def show
        quote = scoped_quotes.find(params[:id])
        render json: QuoteSerializer.detail(quote)
      rescue ActiveRecord::RecordNotFound
        render json: { error: { code: "NOT_FOUND", message: "Quote not found" } }, status: :not_found
      end

      # PATCH /api/v1/quotes/:id (status update only)
      def update
        quote = scoped_quotes.find(params[:id])
        permitted = params.permit(:status, :notes, :customer_id)

        if permitted[:status].present?
          unless Quote::VALID_STATUSES.include?(permitted[:status])
            return render json: { error: { code: "INVALID_STATUS", message: "Invalid status" } }, status: :unprocessable_content
          end
        end

        old_status = quote.status
        if quote.update(permitted.to_h.transform_keys { |k| k.to_s.underscore })
          metadata = {}
          metadata[:status_from] = old_status if permitted[:status].present? && old_status != quote.status
          metadata[:status_to] = quote.status if metadata[:status_from]
          action = metadata[:status_from] ? "quote.status_changed" : "quote.updated"
          AuditLog.track!(user: current_user, action: action, resource: quote, metadata: metadata, ip_address: request.remote_ip)
          render json: QuoteSerializer.detail(quote)
        else
          render json: { error: { code: "VALIDATION_ERROR", message: quote.errors.full_messages.join(", ") } }, status: :unprocessable_content
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: { code: "NOT_FOUND", message: "Quote not found" } }, status: :not_found
      end

      # POST /api/v1/quotes/:id/send_email
      def send_email
        quote = scoped_quotes.find(params[:id])
        email = params[:recipientEmail]
        name = params[:recipientName] || "Customer"
        message = params[:message]

        unless email.present? && email.match?(URI::MailTo::EMAIL_REGEXP)
          return render json: { error: { code: "INVALID_EMAIL", message: "Valid email required" } }, status: :unprocessable_content
        end

        QuoteMailer.send_quote(quote, email, recipient_name: name, message: message).deliver_later
        quote.update(status: "sent") if quote.status == "draft"

        AuditLog.track!(user: current_user, action: "quote.email_sent", resource: quote, metadata: { recipient: email }, ip_address: request.remote_ip)
        render json: { success: true, message: "Quote sent to #{email}" }
      rescue ActiveRecord::RecordNotFound
        render json: { error: { code: "NOT_FOUND", message: "Quote not found" } }, status: :not_found
      end

      # DELETE /api/v1/quotes/:id
      def destroy
        quote = scoped_quotes.find(params[:id])
        AuditLog.track!(user: current_user, action: "quote.deleted", resource: quote, metadata: { reference_no: quote.reference_no }, ip_address: request.remote_ip)
        quote.destroy
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render json: { error: { code: "NOT_FOUND", message: "Quote not found" } }, status: :not_found
      end

      # GET /api/v1/quotes/export.csv
      def export
        filtered_scope = QuoteSearcher.call(scoped_quotes, params)
        result = QuoteExporter.call(filtered_scope)

        AuditLog.track!(user: current_user, action: "quote.exported", resource: Quote.new(id: 0), metadata: { count: result[:count], filters: params.permit(:q, :destination_country, :date_from, :date_to, :status).to_h }, ip_address: request.remote_ip)
        send_data result[:csv_data], filename: "quotes-#{Date.current}.csv", type: "text/csv"
      rescue QuoteExporter::TooLargeError => e
        render json: { error: { code: "EXPORT_TOO_LARGE", message: e.message } }, status: :unprocessable_content
      end

      private

      def expire_stale_drafts!
        cache_key = "quotes:expire_stale_drafts"
        return if Rails.cache.read(cache_key)

        Quote.stale_drafts.update_all(status: "expired")
        Rails.cache.write(cache_key, true, expires_in: 10.minutes)
      end

      def scoped_quotes
        if current_user.role == "admin"
          Quote.recent
        else
          current_user.quotes.recent
        end
      end

      def validate_numeric_bounds!(input)
        NUMERIC_INPUT_BOUNDS.each do |key, bounds|
          raw = input[key] || input[key.to_sym]
          next if raw.nil?

          unless raw.is_a?(Numeric) || raw.to_s.match?(NUMERIC_INPUT_PATTERN)
            raise InvalidInputError, "#{key} must be a number"
          end

          value = raw.to_f
          min = bounds[:min]

          if bounds[:exclusive_min] ? value <= min : value < min
            floor = bounds[:exclusive_min] ? "greater than #{min}" : "at least #{min}"
            raise InvalidInputError, "#{key} must be #{floor}"
          end

          if bounds[:max] && value > bounds[:max]
            raise InvalidInputError, "#{key} must be at most #{bounds[:max]}"
          end
        end
      end

      def clean_params
        params.permit(
          :originCountry, :destinationCountry, :destinationZip,
          :domesticRegionCode, :isJejuPickup,
          :incoterm, :packingType, :shippingItemType, :shippingMode,
          :discountPercent, :dutyTaxEstimate,
          :exchangeRate, :fscPercent,
          :manualDomesticCost, :manualPackingCost, :manualSurgeCost,
          :overseasCarrier, :customerId, :pickupInSeoulCost,
          :dhlDeclaredValue, :fedexDeclaredValue,
          dhlAddOns: [],
          upsAddOns: [],
          fedexAddOns: [],
          items: [ :id, :name, :quantity, :weight, :length, :width, :height ],
          resolvedAddonRates: [ :code, :carrier, :nameEn, :nameKo, :chargeType,
                                :unit, :amount, :perKgRate, :ratePercent, :minAmount,
                                :fscApplicable, :autoDetect, :selectable, :condition,
                                detectRules: {} ],
          resolvedSurcharges: [ :code, :name, :nameKo, :chargeType, :amount, :sourceUrl ]
        ).to_h
      end

      def input_attributes(input)
        i = input.stringify_keys
        {
          origin_country:       i["originCountry"]      || "KR",
          destination_country:  i["destinationCountry"],
          destination_zip:      i["destinationZip"],
          domestic_region_code: i["domesticRegionCode"] || "A",
          is_jeju_pickup:       i["isJejuPickup"]       || false,
          incoterm:             i["incoterm"],
          packing_type:         i["packingType"]        || "NONE",
          shipping_item_type:   i["shippingItemType"]   || "NON_DOCUMENT",
          discount_percent:     i["discountPercent"]    || 15,
          duty_tax_estimate:    i["dutyTaxEstimate"]    || 0,
          exchange_rate:        i["exchangeRate"],
          fsc_percent:          i["fscPercent"],
          manual_domestic_cost: i["manualDomesticCost"],
          manual_packing_cost:  i["manualPackingCost"],
          # 아래 두 컬럼은 DB 에서 NOT NULL DEFAULT 0 이다. 명시적 nil 을 넘기면
          # 기본값이 적용되지 않고 NotNullViolation(500)이 난다. 필드를 생략한
          # 클라이언트 요청이 500 이 되지 않도록 다른 선택 필드와 같은 방식으로 채운다.
          # (manual_domestic_cost / manual_packing_cost 는 nullable 이라 nil 허용)
          manual_surge_cost:    i["manualSurgeCost"]    || 0,
          pickup_in_seoul_cost: i["pickupInSeoulCost"]  || 0,
          overseas_carrier:     i["overseasCarrier"]    || "UPS"
        }
      end


      def result_attributes(result)
        {
          total_quote_amount: result[:totalQuoteAmount],
          total_quote_amount_usd: result[:totalQuoteAmountUSD],
          total_cost_amount: result[:totalCostAmount],
          discount_amount: result[:discountAmount],
          applied_discount_percent: result[:discountPercent],
          billable_weight: result[:billableWeight],
          applied_zone: result[:appliedZone],
          domestic_truck_type: result[:domesticTruckType],
          carrier: result[:carrier],
          transit_time: result[:transitTime]
        }
      end
    end
  end
end
