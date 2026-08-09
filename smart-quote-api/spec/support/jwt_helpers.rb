module JwtHelpers
  def jwt_token_for(user, exp: 24.hours.from_now.to_i)
    payload = { user_id: user.id, role: user.role, exp: exp }
    secret = Rails.application.credentials.secret_key_base || Rails.application.secret_key_base
    JWT.encode(payload, secret, "HS256")
  end

  def auth_headers(token)
    { "Authorization" => "Bearer #{token}" }
  end

  # JwtAuthenticatable#encode_refresh_token 의 스펙용 대응물.
  # 컨트롤러 concern 의 private 메서드라 예제에서 직접 부를 수 없어 동작을 그대로 옮긴다.
  # 시크릿 우선순위(ENV 우선)까지 맞춰야 위조 토큰이 실제 검증 경로를 탄다.
  def encode_refresh_token(user, exp: 7.days.from_now.to_i)
    jti = SecureRandom.uuid
    user.update_column(:refresh_token_jti, jti)

    payload = { user_id: user.id, type: "refresh", jti: jti, exp: exp }
    secret = ENV["SECRET_KEY_BASE"] ||
             Rails.application.credentials.secret_key_base ||
             Rails.application.secret_key_base
    JWT.encode(payload, secret, "HS256")
  end
end
