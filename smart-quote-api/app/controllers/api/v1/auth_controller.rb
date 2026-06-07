module Api
  module V1
    class AuthController < ApplicationController
      include JwtAuthenticatable
      include ActionController::Cookies

      before_action :verify_trusted_origin!, only: [ :register, :login, :refresh, :logout, :request_magic_link, :verify_magic_link ]

      # POST /api/v1/auth/register
      def register
        user = User.new(register_params)

        if user.save
          render_auth_response(user, status: :created)
        else
          render json: {
            error: { code: "VALIDATION_ERROR", message: user.errors.full_messages.join(", ") }
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: params[:email]&.downcase&.strip)

        if user&.authenticate(params[:password])
          render_auth_response(user)
        else
          render json: {
            error: { code: "UNAUTHORIZED", message: "Invalid email or password" }
          }, status: :unauthorized
        end
      end

      # GET /api/v1/auth/me
      def me
        authenticate_user!
        return if performed?
        render json: user_json(current_user)
      end

      # POST /api/v1/auth/refresh — issue new access + refresh token (rotation)
      def refresh
        user = decode_refresh_token(refresh_token_from_cookie)

        if user
          render_auth_response(user)
        else
          clear_refresh_cookie
          render json: { error: { code: "INVALID_TOKEN", message: "Invalid or expired refresh token" } }, status: :unauthorized
        end
      end

      # POST /api/v1/auth/logout — expire the HttpOnly refresh cookie
      def logout
        clear_refresh_cookie
        render json: { message: "Logged out" }, status: :ok
      end

      # PUT /api/v1/auth/password — change password (authenticated)
      def update_password
        authenticate_user!
        return if performed?

        unless current_user.authenticate(params[:current_password])
          return render json: { error: { code: "INVALID_PASSWORD", message: "Current password is incorrect" } }, status: :unprocessable_entity
        end

        if params[:password].blank? || params[:password] != params[:password_confirmation]
          return render json: { error: { code: "VALIDATION_ERROR", message: "Password confirmation does not match" } }, status: :unprocessable_entity
        end

        if current_user.update(password: params[:password])
          render json: { message: "Password updated successfully" }
        else
          render json: { error: { code: "VALIDATION_ERROR", message: current_user.errors.full_messages.join(", ") } }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/auth/magic_link — send magic link email
      def request_magic_link
        user = User.find_by(email: params[:email]&.downcase&.strip)
        if user
          raw_token = MagicLinkToken.generate!(user)
          AuthMailer.magic_link_email(user, raw_token).deliver_now
        end
        render json: { message: "Check your email" }, status: :ok
      rescue Net::SMTPAuthenticationError, Net::SMTPServerBusy, Net::SMTPSyntaxError,
             Net::SMTPFatalError, Net::SMTPUnknownError, Errno::ECONNREFUSED, Timeout::Error => e
        Rails.logger.error "[MagicLink] SMTP delivery failed: #{e.class} - #{e.message}"
        render json: { error: { code: "EMAIL_DELIVERY_FAILED", message: "Failed to send email. Please try again." } }, status: :service_unavailable
      rescue ActiveRecord::StatementInvalid, ActiveRecord::ConnectionNotEstablished => e
        Rails.logger.error "[MagicLink] DB error (migration may not have run): #{e.class} - #{e.message}"
        render json: { error: { code: "INTERNAL_ERROR", message: "Service temporarily unavailable. Please try again." } }, status: :internal_server_error
      rescue => e
        Rails.logger.error "[MagicLink] Unexpected error: #{e.class} - #{e.message}\n#{e.backtrace&.first(3)&.join("\n")}"
        render json: { message: "Check your email" }, status: :ok
      end

      # POST /api/v1/auth/magic_link/verify — verify token and issue JWT
      def verify_magic_link
        token = MagicLinkToken.find_valid_token!(params[:token])
        user  = token.user
        token.consume!
        render_auth_response(user)
      rescue ActiveRecord::RecordNotFound
        render json: { error: { code: "INVALID_TOKEN", message: "Invalid or expired magic link" } }, status: :unauthorized
      end

      # POST /api/v1/auth/promote — one-time admin promotion (secret-protected)
      def promote
        secret = ENV["ADMIN_PROMOTE_SECRET"]
        if secret.blank? || params[:secret] != secret
          return render json: { error: { code: "FORBIDDEN", message: "Forbidden" } }, status: :forbidden
        end

        user = User.find_by(email: params[:email]&.downcase&.strip)
        if user.nil?
          return render json: { error: { code: "NOT_FOUND", message: "User not found" } }, status: :not_found
        end

        user.update!(role: "admin")
        render json: { message: "#{user.email} promoted to admin", role: user.role }
      end

      private

      def register_params
        params.permit(:email, :password, :password_confirmation,
                      :name, :company, :nationality, networks: [])
      end

      def render_auth_response(user, status: :ok)
        set_refresh_cookie(encode_refresh_token(user))
        render json: { token: encode_token(user), user: user_json(user) }, status: status
      end

      def refresh_token_from_cookie
        cookies[:refresh_token]
      end

      def set_refresh_cookie(token)
        cookies[:refresh_token] = refresh_cookie_options.merge(value: token)
      end

      def clear_refresh_cookie
        cookies.delete(:refresh_token, refresh_cookie_options.except(:value, :expires))
      end

      def refresh_cookie_options
        {
          httponly: true,
          secure: refresh_cookie_secure?,
          same_site: refresh_cookie_same_site,
          expires: 7.days.from_now,
          path: "/api/v1/auth"
        }
      end

      def refresh_cookie_secure?
        ENV.fetch("REFRESH_COOKIE_SECURE", Rails.env.production? ? "true" : "false") == "true"
      end

      def refresh_cookie_same_site
        ENV.fetch("REFRESH_COOKIE_SAME_SITE", Rails.env.production? ? "None" : "Lax").downcase.to_sym
      end

      def verify_trusted_origin!
        return unless Rails.env.production? || ENV["AUTH_ORIGIN_CHECK"] == "true"

        origin = request.headers["Origin"]
        return if origin.blank?

        allowed_origins = ENV.fetch("CORS_ORIGINS", "").split(",").map(&:strip)
        return if allowed_origins.include?(origin)

        render json: { error: { code: "FORBIDDEN_ORIGIN", message: "Forbidden origin" } }, status: :forbidden
      end
    end
  end
end
