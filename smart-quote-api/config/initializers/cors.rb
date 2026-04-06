Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'https://smart-quote-emax.vercel.app',
            'https://smart-quote-main.vercel.app',
            /\Ahttps:\/\/smart-quote-emax-.*\.vercel\.app\z/

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"],
      credentials: true,
      max_age: 600
  end
end
