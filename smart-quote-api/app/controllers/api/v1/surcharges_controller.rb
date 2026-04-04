module Api
  module V1
    class SurchargesController < ApplicationController
      include JwtAuthenticatable

      before_action :authenticate_user!
      before_action :require_admin!, except: [ :resolve ]
      before_action :set_surcharge, only: [ :update, :destroy ]

      # GET /api/v1/surcharges
      def index
        surcharges = Surcharge.where(is_active: true).by_code
        render json: { surcharges: surcharges.map { |s| serialize(s) } }
      end

      # POST /api/v1/surcharges
      def create
        surcharge = Surcharge.new(surcharge_params)
        surcharge.created_by = current_user.email

        if surcharge.save
          SurchargeResolver.invalidate_cache!
          track_surcharges_updated!
          audit_log!("surcharge.created", surcharge)
          render json: serialize(surcharge), status: :created
        else
          render json: { error: { code: "VALIDATION_ERROR", messages: surcharge.errors.full_messages } },
                 status: :unprocessable_entity
        end
      end

      # PUT /api/v1/surcharges/:id
      def update
        if @surcharge.update(surcharge_params)
          SurchargeResolver.invalidate_cache!
          track_surcharges_updated!
          audit_log!("surcharge.updated", @surcharge)
          render json: serialize(@surcharge)
        else
          render json: { error: { code: "VALIDATION_ERROR", messages: @surcharge.errors.full_messages } },
                 status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/surcharges/:id (soft delete)
      def destroy
        @surcharge.update!(is_active: false)
        SurchargeResolver.invalidate_cache!
        track_surcharges_updated!
        audit_log!("surcharge.deleted", @surcharge)
        render json: { success: true }
      end

      # GET /api/v1/surcharges/resolve?carrier=UPS&country=IL&zone=Z9
      def resolve
        carrier = params[:carrier]&.upcase
        country = params[:country]&.upcase
        zone = params[:zone]

        result = SurchargeResolver.resolve(
          carrier: carrier,
          country: country,
          zone: zone
        )

        render json: { surcharges: result }
      end

      private

      def set_surcharge
        @surcharge = Surcharge.find(params[:id])
      end

      def track_surcharges_updated!
        Rails.cache.write("surcharges_updated_at", Time.current.iso8601, expires_in: 30.days)
      end

      def surcharge_params
        params.permit(:code, :name, :name_ko, :description, :carrier,
                       :zone, :country_codes, :charge_type, :amount,
                       :effective_from, :effective_to, :is_active, :source_url)
      end

      def audit_log!(action, surcharge)
        AuditLog.track!(
          user: current_user,
          action: action,
          resource: surcharge,
          metadata: { code: surcharge.code, name: surcharge.name, amount: surcharge.amount.to_f },
          ip_address: request.remote_ip
        )
      end

      def serialize(s)
        {
          id: s.id,
          code: s.code,
          name: s.name,
          nameKo: s.name_ko,
          description: s.description,
          carrier: s.carrier,
          zone: s.zone,
          countryCodes: s.country_codes_array,
          chargeType: s.charge_type,
          amount: s.amount.to_f,
          effectiveFrom: s.effective_from.iso8601,
          effectiveTo: s.effective_to&.iso8601,
          isActive: s.is_active,
          sourceUrl: s.source_url,
          createdBy: s.created_by,
          createdAt: s.created_at.iso8601,
          updatedAt: s.updated_at.iso8601
        }
      end
    end
  end
end
