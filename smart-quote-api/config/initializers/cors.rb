# CORS configuration
# Set CORS_ORIGINS env variable to restrict allowed origins in production.
# Example: CORS_ORIGINS=https://app.emax.kr,https://admin.emax.kr
# HttpOnly refresh cookies require credentialed CORS and explicit origins.
# Keep production CORS_ORIGINS restricted to the deployed frontend origins.
allowed_origins = ENV.fetch("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",").map(&:strip)
if allowed_origins.include?("*")
  raise "CORS_ORIGINS cannot include '*' when credentialed HttpOnly refresh cookies are enabled"
end

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      expose: [ "Authorization" ],
      credentials: true,
      max_age: 600
  end
end
