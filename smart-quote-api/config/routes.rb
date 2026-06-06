Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # Auth (public)
      post "auth/register", to: "auth#register"
      post "auth/login",    to: "auth#login"
      get  "auth/me",       to: "auth#me"
      post "auth/refresh",  to: "auth#refresh"
      post "auth/logout",   to: "auth#logout"
      put  "auth/password", to: "auth#update_password"
      post "auth/promote",  to: "auth#promote"
      post "auth/magic_link",        to: "auth#request_magic_link"
      post "auth/magic_link/verify", to: "auth#verify_magic_link"

      # Quotes (protected, except calculate)
      post "quotes/calculate", to: "quotes#calculate"
      get "quotes/export", to: "quotes#export"
      resources :quotes, only: [ :index, :show, :create, :update, :destroy ] do
        member do
          post :send_email
        end
      end

      # Customers
      resources :customers, only: [ :index, :show, :create, :update, :destroy ]

      # Users (admin only)
      resources :users, only: [ :index, :update, :destroy ]

      # Discount Rules (CRUD: admin, resolve: authenticated)
      resources :discount_rules, only: [ :index, :create, :update, :destroy ] do
        collection do
          get :resolve   # deprecated — kept for backward compat
          post :resolve  # preferred — PII in request body
        end
      end

      # Audit Logs (admin only)
      resources :audit_logs, only: [ :index ]

      # Logistics News (public)
      get "notices/news", to: "notices#news"

      # Surcharges (CRUD: admin, resolve: authenticated)
      resources :surcharges, only: [ :index, :create, :update, :destroy ] do
        collection do
          get :resolve
        end
      end

      # Add-on Rates (CRUD: admin, resolve: authenticated)
      resources :addon_rates, only: [ :index, :create, :update, :destroy ] do
        collection do
          get :resolve
        end
      end

      # Exchange Rates (public - no auth required)
      get "exchange_rates", to: "exchange_rates#index"

      # Jet Fuel Prices (public - proxies EIA API to keep key server-side)
      get "jet_fuel", to: "jet_fuel#index"

      # FSC Rates
      get "fsc/rates", to: "fsc#rates"
      post "fsc/update", to: "fsc#update_rates"

      # Quote Sharing
      post "quotes/:quote_id/share", to: "quote_shares#create"
      get "shared/:token", to: "quote_shares#show"
    end
  end

  # CORS preflight OPTIONS requests are handled by rack-cors middleware (config/initializers/cors.rb)
end
