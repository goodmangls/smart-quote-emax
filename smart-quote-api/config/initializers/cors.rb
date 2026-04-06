Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    if ENV["CORS_ORIGINS"].present?
      origins(*ENV["CORS_ORIGINS"].split(",").map(&:strip))
    else
      origins '*'
    end
    
    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"],
      credentials: false,
      max_age: 600
  end
end
