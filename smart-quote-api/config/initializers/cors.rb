# CORS configuration
# Set CORS_ORIGINS env variable to restrict allowed origins in production.
# Example: CORS_ORIGINS=https://app.emax.kr,https://admin.emax.kr
# Defaults to "*" (all origins) if unset — ensure CORS_ORIGINS is set in production Render env.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("CORS_ORIGINS", "*").split(","))

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      expose: [ "Authorization" ],
      credentials: false,
      max_age: 600
  end
end
