Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Define allowed origins
    allowed = ENV.fetch("CORS_ORIGINS", "https://smart-quote-emax.vercel.app, https://smart-quote-main.vercel.app").split(",").map(&:strip)
    
    # Add common patterns if needed, but origins(*allowed) is safest for exact matches
    origins(*allowed)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"],
      credentials: true
  end
end
