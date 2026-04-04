module JwtHelpers
  def jwt_token_for(user, exp: 24.hours.from_now.to_i)
    payload = { user_id: user.id, role: user.role, exp: exp }
    secret = Rails.application.credentials.secret_key_base || Rails.application.secret_key_base
    JWT.encode(payload, secret, "HS256")
  end

  def auth_headers(token)
    { "Authorization" => "Bearer #{token}" }
  end
end
