Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    allowed = ENV.fetch("CORS_ORIGINS", "https://smart-quote-main.vercel.app").split(",").map(&:strip)

    # Safety: reject localhost in production
    if Rails.env.production? && allowed.any? { |o| o.include?("localhost") }
      Rails.logger.error "[CORS] SECURITY: localhost origin detected in production CORS_ORIGINS!"
      allowed.reject! { |o| o.include?("localhost") }
    end

    allowed += [ "http://localhost:5173", "http://localhost:3000" ] if Rails.env.development?

    origins(*allowed)

    resource "*",
      headers: :any,
      expose: [ "Authorization" ],
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ]
  end
end
