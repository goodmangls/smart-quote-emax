module Api
  module V1
    class NoticesController < ApplicationController
      # GET /api/v1/notices/news
      # Public endpoint — no auth required (dashboard widget)
      def news
        items = LogisticsNewsFetcher.call

        render json: items
      end
    end
  end
end
