module Api
  module V1
    class AuthController < ApplicationController
      include JwtAuthenticatable

      # POST /api/v1/auth/register
      def register
        user = User.new(register_params)

        if user.save
          token = encode_token(user)
          render json: { token: token, refresh_token: encode_refresh_token(user), user: user_json(user) }, status: :created
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
          token = encode_token(user)
          render json: { token: token, refresh_token: encode_refresh_token(user), user: user_json(user) }
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
        user = decode_refresh_token(params[:refresh_token])

        if user
          new_refresh = encode_refresh_token(user)
          render json: { token: encode_token(user), refresh_token: new_refresh, user: user_json(user) }
        else
          render json: { error: { code: "INVALID_TOKEN", message: "Invalid or expired refresh token" } }, status: :unauthorized
        end
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
        Rails.logger.error "MagicLink SMTP delivery failed: #{e.class} - #{e.message}"
        render json: { error: { code: "EMAIL_DELIVERY_FAILED", message: "Failed to send email. Please try again." } }, status: :service_unavailable
      rescue => e
        Rails.logger.error "MagicLink request error: #{e.class} - #{e.message}"
        render json: { message: "Check your email" }, status: :ok
      end

      # POST /api/v1/auth/magic_link/verify — verify token and issue JWT
      def verify_magic_link
        token = MagicLinkToken.find_valid_token!(params[:token])
        user  = token.user
        token.consume!
        render json: {
          token:         encode_token(user),
          refresh_token: encode_refresh_token(user),
          user:          user_json(user)
        }, status: :ok
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
    end
  end
end
