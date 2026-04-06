Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ->(origin, env) {
      if ENV["CORS_ORIGINS"].present?
        allowed_origins = ENV["CORS_ORIGINS"].split(",").map(&:strip)
        allowed_origins.include?(origin)
      else
        true
      end
    }
    
    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"],
      credentials: false,
      max_age: 600
  end
end
