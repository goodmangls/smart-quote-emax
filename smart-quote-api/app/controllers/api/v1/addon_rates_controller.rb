module Api
  module V1
    class AddonRatesController < ApplicationController
      include JwtAuthenticatable

      before_action :authenticate_user!
      before_action :require_admin!, except: [ :resolve ]
      before_action :set_addon_rate, only: [ :update, :destroy ]

      # GET /api/v1/addon_rates
      def index
        rates = AddonRate.where(is_active: true).ordered
        rates = rates.for_carrier(params[:carrier].upcase) if params[:carrier].present?
        render json: { addonRates: rates.map { |r| serialize(r) } }
      end

      # POST /api/v1/addon_rates
      def create
        rate = AddonRate.new(addon_rate_params)
        rate.created_by = current_user.email

        if rate.save
          AddonRateResolver.invalidate_cache!
          audit_log!("addon_rate.created", rate)
          render json: serialize(rate), status: :created
        else
          render json: { error: { code: "VALIDATION_ERROR", messages: rate.errors.full_messages } },
                 status: :unprocessable_entity
        end
      end

      # PUT /api/v1/addon_rates/:id
      def update
        if @addon_rate.update(addon_rate_params)
          AddonRateResolver.invalidate_cache!
          audit_log!("addon_rate.updated", @addon_rate)
          render json: serialize(@addon_rate)
        else
          render json: { error: { code: "VALIDATION_ERROR", messages: @addon_rate.errors.full_messages } },
                 status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/addon_rates/:id (soft delete)
      def destroy
        @addon_rate.update!(is_active: false)
        AddonRateResolver.invalidate_cache!
        audit_log!("addon_rate.deleted", @addon_rate)
        render json: { success: true }
      end

      # GET /api/v1/addon_rates/resolve?carrier=DHL
      def resolve
        carrier = params[:carrier]&.upcase
        unless carrier.present? && AddonRate::CARRIERS.include?(carrier)
          return render json: { error: { code: "INVALID_CARRIER", message: "carrier must be UPS or DHL" } },
                        status: :unprocessable_entity
        end

        result = AddonRateResolver.resolve(carrier: carrier)
        render json: { addonRates: result }
      end

      private

      def set_addon_rate
        @addon_rate = AddonRate.find(params[:id])
      end

      def addon_rate_params
        params.permit(
          :code, :carrier, :name_en, :name_ko, :description,
          :charge_type, :unit, :amount,
          :per_kg_rate, :rate_percent, :min_amount,
          :fsc_applicable, :auto_detect, :selectable, :condition,
          :effective_from, :effective_to, :is_active, :source_url, :sort_order,
          detect_rules: {}
        )
      end

      def audit_log!(action, rate)
        AuditLog.track!(
          user: current_user,
          action: action,
          resource: rate,
          metadata: { code: rate.code, carrier: rate.carrier, amount: rate.amount.to_f },
          ip_address: request.remote_ip
        )
      end

      def serialize(r)
        {
          id: r.id,
          code: r.code,
          carrier: r.carrier,
          nameEn: r.name_en,
          nameKo: r.name_ko,
          description: r.description,
          chargeType: r.charge_type,
          unit: r.unit,
          amount: r.amount.to_f,
          perKgRate: r.per_kg_rate&.to_f,
          ratePercent: r.rate_percent&.to_f,
          minAmount: r.min_amount&.to_f,
          fscApplicable: r.fsc_applicable,
          autoDetect: r.auto_detect,
          selectable: r.selectable,
          condition: r.condition,
          detectRules: r.detect_rules,
          effectiveFrom: r.effective_from.iso8601,
          effectiveTo: r.effective_to&.iso8601,
          isActive: r.is_active,
          sourceUrl: r.source_url,
          sortOrder: r.sort_order,
          createdBy: r.created_by,
          createdAt: r.created_at.iso8601,
          updatedAt: r.updated_at.iso8601
        }
      end
    end
  end
end
