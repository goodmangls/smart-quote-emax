module JwtAuthenticatable
  extend ActiveSupport::Concern

  private

  def authenticate_user!
    @current_user = user_from_token
    render_unauthorized unless @current_user
  end

  def current_user
    @current_user
  end

  def user_from_token
    token = extract_token
    return nil unless token

    decoded = JWT.decode(token, jwt_secret, true, algorithm: "HS256")
    payload = decoded[0]

    User.find_by(id: payload["user_id"])
  rescue JWT::DecodeError => e
    Rails.logger.warn "[AUTH] JWT decode failed: #{e.message} | IP: #{request.remote_ip}"
    nil
  rescue JWT::ExpiredSignature
    Rails.logger.info "[AUTH] JWT expired | IP: #{request.remote_ip}"
    nil
  end

  def encode_token(user)
    payload = {
      user_id: user.id,
      role: user.role,
      exp: 15.minutes.from_now.to_i
    }
    JWT.encode(payload, jwt_secret, "HS256")
  end

  def encode_refresh_token(user)
    jti = SecureRandom.uuid
    user.update_column(:refresh_token_jti, jti)

    payload = {
      user_id: user.id,
      type: "refresh",
      jti: jti,
      exp: 7.days.from_now.to_i
    }
    JWT.encode(payload, jwt_secret, "HS256")
  end

  def decode_refresh_token(token)
    decoded = JWT.decode(token, jwt_secret, true, algorithm: "HS256")
    payload = decoded[0]
    return nil unless payload["type"] == "refresh"

    user = User.find_by(id: payload["user_id"])
    return nil unless user
    return nil unless user.refresh_token_jti == payload["jti"]

    user
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end

  def extract_token
    header = request.headers["Authorization"]
    header&.split(" ")&.last
  end

  def jwt_secret
    # Prefer ENV (stable across deploys on Render) over credentials
    ENV["SECRET_KEY_BASE"] || Rails.application.credentials.secret_key_base || Rails.application.secret_key_base
  end

  def require_admin!
    authenticate_user!
    return if performed?
    unless current_user&.role == "admin"
      render json: { error: { code: "FORBIDDEN", message: "Admin only" } }, status: :forbidden
    end
  end

  def render_unauthorized
    render json: {
      error: { code: "UNAUTHORIZED", message: "Unauthorized" }
    }, status: :unauthorized
  end

  def user_json(user)
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      company: user.company,
      nationality: user.nationality
    }
  end
end
