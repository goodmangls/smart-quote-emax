module Api
  module V1
    class UsersController < ApplicationController
      include JwtAuthenticatable

      before_action :authenticate_user!
      before_action :require_admin!

      # GET /api/v1/users
      def index
        users = User.left_joins(:quotes)
                    .select("users.*, COUNT(quotes.id) AS quotes_count")
                    .group("users.id")
                    .order(created_at: :desc)
        render json: users.map { |u| user_detail(u) }
      end

      # PATCH /api/v1/users/:id
      def update
        user = User.find(params[:id])
        permitted = params.permit(:name, :company, :nationality, :role, networks: [])

        if permitted[:role].present? && !%w[admin user member].include?(permitted[:role])
          return render json: { error: { code: "INVALID_ROLE", message: "Role must be admin, user, or member" } }, status: :unprocessable_entity
        end

        if user.update(permitted.to_h)
          render json: user_detail(user)
        else
          render json: { error: { code: "VALIDATION_ERROR", message: user.errors.full_messages.join(", ") } }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/users/:id
      def destroy
        user = User.find(params[:id])

        if user.id == current_user.id
          return render json: { error: { code: "FORBIDDEN", message: "Cannot delete yourself" } }, status: :forbidden
        end

        user.destroy
        head :no_content
      end

      private

      def user_detail(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          nationality: user.nationality,
          networks: user.networks,
          role: user.role,
          quoteCount: user.try(:quotes_count) || user.quotes.count,
          createdAt: user.created_at.iso8601
        }
      end
    end
  end
end
