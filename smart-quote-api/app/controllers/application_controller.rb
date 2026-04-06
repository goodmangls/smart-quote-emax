class ApplicationController < ActionController::API
  before_action :set_cors_headers

  rescue_from ActiveRecord::RecordNotFound do |e|
    render json: { error: { code: "NOT_FOUND", message: e.message } }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: { code: "PARAMETER_MISSING", message: e.message } }, status: :bad_request
  end

  private

  def set_cors_headers
    response.headers["Access-Control-Allow-Origin"]  = request.headers["Origin"] || "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
    response.headers["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept, Authorization, X-Requested-With"
    response.headers["Access-Control-Expose-Headers"] = "Authorization"
    response.headers["Access-Control-Max-Age"] = "600"

    # Handle preflight OPTIONS requests immediately
    head :ok if request.method == "OPTIONS"
  end
end
