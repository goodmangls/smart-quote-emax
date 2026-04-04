module Api
  module V1
    class AuditLogsController < ApplicationController
      include JwtAuthenticatable

      before_action :authenticate_user!
      before_action :require_admin!

      # GET /api/v1/audit_logs
      def index
        logs = AuditLog.recent
                       .includes(:user)
                       .by_action(params[:action_type])

        if params[:q].present?
          q = "%#{AuditLog.sanitize_sql_like(params[:q])}%"
          logs = logs.where("resource_ref ILIKE :q OR audit_logs.metadata::text ILIKE :q", q: q)
        end

        if params[:user_id].present?
          logs = logs.where(user_id: params[:user_id])
        end

        if params[:date_from].present?
          parsed = Date.parse(params[:date_from]) rescue nil
          logs = logs.where("audit_logs.created_at >= ?", parsed) if parsed
        end

        if params[:date_to].present?
          parsed = Date.parse(params[:date_to]) rescue nil
          logs = logs.where("audit_logs.created_at <= ?", parsed.end_of_day) if parsed
        end

        logs = logs.page(params[:page] || 1).per([ (params[:per_page] || 50).to_i, 100 ].min)

        render json: {
          logs: logs.map { |log| serialize(log) },
          pagination: {
            currentPage: logs.current_page,
            totalPages: logs.total_pages,
            totalCount: logs.total_count,
            perPage: logs.limit_value
          }
        }
      end

      private

      def serialize(log)
        {
          id: log.id,
          action: log.action,
          resourceType: log.resource_type,
          resourceId: log.resource_id,
          resourceRef: log.resource_ref,
          metadata: log.metadata,
          ipAddress: log.ip_address,
          userName: log.user&.name || log.user&.email,
          userId: log.user_id,
          createdAt: log.created_at.iso8601
        }
      end
    end
  end
end
