class Rack::Attack
  # Throttle login attempts: 5 per minute per IP
  throttle("auth/login", limit: 5, period: 60) do |req|
    req.ip if req.path == "/api/v1/auth/login" && req.post?
  end

  # Throttle registration: 3 per hour per IP
  throttle("auth/register", limit: 3, period: 3600) do |req|
    req.ip if req.path == "/api/v1/auth/register" && req.post?
  end

  # Throttle password change: 5 per minute per IP (brute-force protection)
  throttle("auth/password", limit: 5, period: 60) do |req|
    req.ip if req.path == "/api/v1/auth/password" && req.put?
  end

  # Throttle token refresh: 30 per minute per IP
  throttle("auth/refresh", limit: 30, period: 60) do |req|
    req.ip if req.path == "/api/v1/auth/refresh" && req.post?
  end

  # Throttle public calculate endpoint: 60 per minute per IP
  throttle("quotes/calculate", limit: 60, period: 60) do |req|
    req.ip if req.path == "/api/v1/quotes/calculate" && req.post?
  end

  # General API throttle: 300 requests per minute per IP
  throttle("api/general", limit: 300, period: 60) do |req|
    req.ip if req.path.start_with?("/api/")
  end

  # Return JSON error response
  self.throttled_responder = lambda do |_req|
    [
      429,
      { "Content-Type" => "application/json" },
      [ { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } }.to_json ]
    ]
  end
end
