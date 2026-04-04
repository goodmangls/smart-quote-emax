module Api
  module V1
    class DiscountRulesController < ApplicationController
      include JwtAuthenticatable

      before_action :authenticate_user!
      before_action :require_admin!, except: [ :resolve ]
      before_action :set_discount_rule, only: [ :update, :destroy ]
      before_action :validate_resolve_params!, only: [ :resolve ]

      # GET /api/v1/discount_rules
      def index
        rules = DiscountRule.by_priority
        render json: { rules: rules.map { |r| serialize_rule(r) } }
      end

      # POST /api/v1/discount_rules
      def create
        rule = DiscountRule.new(discount_rule_params)
        rule.created_by = current_user.email

        if rule.save
          invalidate_cache!
          audit_log!("discount_rule.created", rule)
          render json: serialize_rule(rule), status: :created
        else
          render json: { error: { code: "VALIDATION_ERROR", messages: rule.errors.full_messages } },
                 status: :unprocessable_entity
        end
      end

      # PUT /api/v1/discount_rules/:id
      def update
        if @discount_rule.update(discount_rule_params)
          invalidate_cache!
          audit_log!("discount_rule.updated", @discount_rule)
          render json: serialize_rule(@discount_rule)
        else
          render json: { error: { code: "VALIDATION_ERROR", messages: @discount_rule.errors.full_messages } },
                 status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/discount_rules/:id (soft delete)
      def destroy
        @discount_rule.update!(is_active: false)
        invalidate_cache!
        audit_log!("discount_rule.deleted", @discount_rule)
        render json: { success: true }
      end

      # GET /api/v1/discount_rules/resolve
      def resolve
        result = DiscountRuleResolver.resolve(
          email: params[:email],
          nationality: params[:nationality],
          weight: params[:weight].to_f
        )

        render json: {
          discountPercent: result[:discount_percent],
          matchedRule: result[:matched_rule] ? { id: result[:matched_rule].id, name: result[:matched_rule].name } : nil,
          fallback: result[:fallback]
        }
      end

      private

      def set_discount_rule
        @discount_rule = DiscountRule.find(params[:id])
      end

      def discount_rule_params
        params.permit(:name, :rule_type, :priority, :match_email,
                       :match_nationality, :weight_min, :weight_max,
                       :discount_percent, :is_active)
      end

      def validate_resolve_params!
        unless params[:email].present?
          render json: { error: { code: "VALIDATION_ERROR", message: "email is required" } },
                 status: :unprocessable_entity and return
        end

        weight = params[:weight]
        unless weight.present? && weight.to_s.match?(/\A\d+(\.\d+)?\z/) && weight.to_f > 0
          render json: { error: { code: "VALIDATION_ERROR", message: "weight must be a positive number" } },
                 status: :unprocessable_entity and return
        end
      end

      def invalidate_cache!
        Rails.cache.delete(DiscountRuleResolver::CACHE_KEY)
      end

      def audit_log!(action, rule)
        AuditLog.track!(
          user: current_user,
          action: action,
          resource: rule,
          metadata: { name: rule.name, discount_percent: rule.discount_percent.to_f },
          ip_address: request.remote_ip
        )
      end

      def serialize_rule(rule)
        {
          id: rule.id,
          name: rule.name,
          ruleType: rule.rule_type,
          priority: rule.priority,
          matchEmail: rule.match_email,
          matchNationality: rule.match_nationality,
          weightMin: rule.weight_min&.to_f,
          weightMax: rule.weight_max&.to_f,
          discountPercent: rule.discount_percent.to_f,
          isActive: rule.is_active,
          createdBy: rule.created_by,
          createdAt: rule.created_at.iso8601,
          updatedAt: rule.updated_at.iso8601
        }
      end
    end
  end
end
