class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound do |e|
    render json: { error: { code: "NOT_FOUND", message: e.message } }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: { code: "PARAMETER_MISSING", message: e.message } }, status: :bad_request
  end
end
