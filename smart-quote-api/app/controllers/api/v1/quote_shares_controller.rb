module Api
  module V1
    class QuoteSharesController < ApplicationController
      include JwtAuthenticatable
      before_action :authenticate_user!, only: [ :create ]

      # POST /api/v1/quotes/:quote_id/share
      def create
        quote = current_user.role == "admin" ? Quote.find(params[:quote_id]) : current_user.quotes.find(params[:quote_id])

        token = SecureRandom.urlsafe_base64(20)
        expires_at = 7.days.from_now

        quote.update!(
          share_token: token,
          share_expires_at: expires_at
        )

        render json: {
          shareUrl: "#{request.base_url}/shared/#{token}",
          token: token,
          expiresAt: expires_at.iso8601
        }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: { message: "Quote not found" } }, status: :not_found
      end

      # GET /api/v1/shared/:token
      def show
        quote = Quote.find_by!(share_token: params[:token])

        if quote.share_expires_at && quote.share_expires_at < Time.current
          return render json: { error: { message: "This share link has expired" } }, status: :gone
        end

        render json: QuoteSerializer.detail(quote).merge(shared: true)
      rescue ActiveRecord::RecordNotFound
        render json: { error: { message: "Invalid or expired share link" } }, status: :not_found
      end
    end
  end
end
